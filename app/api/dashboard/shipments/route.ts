import { NextRequest, NextResponse } from "next/server";
import { shipmentSchema } from "@/lib/validations";
import { db } from "@/db";
import { shipments, customers, invoices, trips } from "@/db/schema";
import { auth } from "@/lib/auth";
import { count, or, ilike, sql, and, gte, lte, eq, SQL } from "drizzle-orm";
import { emailService } from "@/services/email.service";
import { getStatusDisplay } from "@/lib/utils/shipment";
import {
  createDownloadToken,
  getAppBaseUrl,
  invoiceDownloadUrl,
  receiptDownloadUrl,
} from "@/lib/document-tokens";
import { signReceiptDownloadToken } from "@/lib/documents/receipt-token";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1"));
    const pageSize = Math.min(100, parseInt(sp.get("pageSize") || "10"));
    const search = sp.get("search") || "";
    const startDate = sp.get("startDate");
    const endDate = sp.get("endDate");
    const tripId = sp.get("tripId") || undefined;
    const offset = (page - 1) * pageSize;

    const conditions: SQL[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(shipments.trackingNumber, `%${search}%`),
          ilike(shipments.chassisNumber, `%${search}%`),
          ilike(shipments.itemName, `%${search}%`),
          sql`EXISTS (SELECT 1 FROM ${customers} c WHERE c.id = ${shipments.senderId} AND c.name ILIKE ${`%${search}%`})`,
          sql`EXISTS (SELECT 1 FROM ${customers} c WHERE c.id = ${shipments.receiverId} AND c.name ILIKE ${`%${search}%`})`,
        ) as SQL,
      );
    }

    if (startDate) conditions.push(gte(shipments.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(shipments.createdAt, new Date(endDate)));
    if (tripId) {
      if (tripId === "none") {
        conditions.push(sql`${shipments.tripId} IS NULL`);
      } else {
        conditions.push(eq(shipments.tripId, tripId));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.shipments.findMany({
      where: whereClause,
      with: {
        sender: true,
        receiver: true,
        trip: { with: { vessel: true } },
      },
      orderBy: (s, { desc }) => [desc(s.createdAt)],
      limit: pageSize,
      offset,
    });

    const [countResult] = await db
      .select({ value: count() })
      .from(shipments)
      .where(whereClause);
    const total = Number(countResult.value);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get shipments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = shipmentSchema.parse(body);
    const notifyPartiesByEmail = body?.notifyPartiesByEmail === true;

    let senderId = validatedData.senderId;
    let receiverId = validatedData.receiverId;

    // Upsert Sender
    if (validatedData.sender) {
      const result = await db
        .insert(customers)
        .values(validatedData.sender)
        .onConflictDoUpdate({ target: customers.email, set: validatedData.sender })
        .returning();
      senderId = result[0].id;
    }

    // Upsert Receiver
    if (validatedData.receiver) {
      const result = await db
        .insert(customers)
        .values(validatedData.receiver)
        .onConflictDoUpdate({ target: customers.email, set: validatedData.receiver })
        .returning();
      receiverId = result[0].id;
    }

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: "Sender and receiver are required" },
        { status: 400 },
      );
    }

    let initialStatus = "pending";
    if (validatedData.tripId) {
      const trip = await db.query.trips.findFirst({
        where: eq(trips.id, validatedData.tripId),
      });
      if (trip) {
        initialStatus = trip.status;
      }
    }

    const [newShipment] = await db
      .insert(shipments)
      .values({
        trackingNumber: validatedData.trackingNumber,
        chassisNumber: validatedData.chassisNumber,
        senderId,
        receiverId,
        tripId: validatedData.tripId ?? null,
        shipmentType: validatedData.shipmentType,
        itemName: validatedData.itemName,
        itemDescription: validatedData.itemDescription,
        itemWeight: validatedData.itemWeight,
        itemDimensions: validatedData.itemDimensions,
        itemImage: validatedData.itemImage,
        shippingCost: validatedData.shippingCost,
        estimatedDelivery: validatedData.estimatedDelivery,
        status: initialStatus,
      })
      .returning();

    const shipmentId = newShipment.id;

    // Auto-generate invoice
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);
    const invoiceToken = createDownloadToken();
    const [createdInvoice] = await db.insert(invoices).values({
      invoiceNumber: `INV-${shipmentId}-${Date.now()}`,
      shipmentId,
      senderId,
      receiverId,
      currency: "EUR",
      subtotal: Math.round(Number(newShipment.shippingCost || 0) * 100),
      taxAmount: 0,
      totalAmount: Math.round(Number(newShipment.shippingCost || 0) * 100),
      status: "issued",
      issuedAt: issueDate,
      dueDate,
      notes: "Facture générée automatiquement lors de la création de l'expédition.",
      downloadToken: invoiceToken,
    }).returning();

    if (notifyPartiesByEmail) {
      try {
        const [sender, receiver] = await Promise.all([
          db.query.customers.findFirst({ where: eq(customers.id, senderId) }),
          db.query.customers.findFirst({ where: eq(customers.id, receiverId) }),
        ]);

        if (sender && receiver) {
          const baseUrl = getAppBaseUrl(request.url);
          const receiptToken = await signReceiptDownloadToken(shipmentId);
          const statusSummary = `L'expédition ${newShipment.trackingNumber} est actuellement ${getStatusDisplay(newShipment.status)}.`;
          const recipients = [
            { name: sender.name, email: sender.email },
            { name: receiver.name, email: receiver.email },
          ];

          await Promise.all(
            recipients.map((recipient) =>
              emailService.sendShipmentDocumentLinksEmail({
                recipient,
                trackingNumber: newShipment.trackingNumber,
                itemName: newShipment.itemName,
                senderName: sender.name,
                receiverName: receiver.name,
                estimatedDelivery: newShipment.estimatedDelivery
                  ? newShipment.estimatedDelivery.toISOString()
                  : undefined,
                status: newShipment.status,
                statusSummary,
                invoiceDownloadUrl: invoiceDownloadUrl(
                  createdInvoice.downloadToken,
                  baseUrl,
                ),
                receiptDownloadUrl: receiptDownloadUrl(shipmentId, receiptToken, baseUrl),
              }),
            ),
          );
        }
      } catch (emailError) {
        console.error("Shipment created but email packet failed:", emailError);
      }
    }

    return NextResponse.json({ shipment: newShipment }, { status: 201 });
  } catch (error) {
    console.error("Create shipment error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
