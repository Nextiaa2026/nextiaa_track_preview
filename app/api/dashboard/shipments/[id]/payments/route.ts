import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { invoices, payments, shipments } from "@/db/schema";
import { createDownloadToken, getAppBaseUrl, invoiceDownloadUrl, paymentReceiptDownloadUrl } from "@/lib/document-tokens";
import { loadShipmentDocumentData } from "@/lib/documents/load-shipment-document";
import { buildAutoTransitInvoiceHtml } from "@/lib/documents/invoice-template";
import { emailService } from "@/services/email.service";

const paymentInputSchema = z.object({
  amount: z.union([z.string(), z.number()]).transform((v) => String(v).trim()),
  reason: z.string().min(1).optional().default("acompte"),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
  notifyParties: z.boolean().optional().default(true),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: shipmentId } = await params;

    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, shipmentId),
      columns: { id: true, shippingCost: true },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const rows = await db.query.payments.findMany({
      where: eq(payments.shipmentId, shipmentId),
      orderBy: [asc(payments.paidAt)],
    });

    const totalPaid = rows.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const shippingCost = Number(shipment.shippingCost || 0);

    return NextResponse.json({
      data: rows,
      totalPaid,
      shippingCost,
      remaining: Math.max(0, shippingCost - totalPaid),
    });
  } catch (error) {
    console.error("List payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: shipmentId } = await params;
    const body = await request.json();
    const validated = paymentInputSchema.parse(body);

    const amountNum = Number(validated.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, shipmentId),
      with: {
        sender: true,
        receiver: true,
        invoices: true,
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const invoice =
      [...shipment.invoices].sort(
        (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      )[0] ?? null;

    const [payment] = await db
      .insert(payments)
      .values({
        shipmentId,
        invoiceId: invoice?.id ?? null,
        amount: String(amountNum),
        reason: validated.reason.trim(),
        paidAt: validated.paidAt ? new Date(validated.paidAt) : new Date(),
        notes: validated.notes?.trim() || null,
        downloadToken: createDownloadToken(),
      })
      .returning();

    // Refresh invoice paid status from all payments
    const allPayments = await db.query.payments.findMany({
      where: eq(payments.shipmentId, shipmentId),
    });
    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const shippingCost = Number(shipment.shippingCost || 0);

    if (invoice) {
      const fullyPaid = totalPaid >= shippingCost && shippingCost > 0;
      await db
        .update(invoices)
        .set({
          status: fullyPaid ? "paid" : invoice.status === "paid" ? "issued" : invoice.status,
          paidAt: fullyPaid ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));
    }

    if (validated.notifyParties) {
      try {
        const baseUrl = getAppBaseUrl(request.url);
        let invoiceToken = invoice?.downloadToken;
        if (invoice && !invoiceToken) {
          invoiceToken = createDownloadToken();
          await db
            .update(invoices)
            .set({ downloadToken: invoiceToken, updatedAt: new Date() })
            .where(eq(invoices.id, invoice.id));
        }

        const doc = await loadShipmentDocumentData(shipmentId, {
          invoiceId: invoice?.id,
        });
        const invoiceHtml = doc ? buildAutoTransitInvoiceHtml(doc) : "";
        const downloadHref = invoiceToken
          ? invoiceDownloadUrl(invoiceToken, baseUrl)
          : paymentReceiptDownloadUrl(payment.downloadToken, baseUrl);

        const recipients = [
          { name: shipment.sender.name, email: shipment.sender.email },
          { name: shipment.receiver.name, email: shipment.receiver.email },
        ];

        await Promise.all(
          recipients.map((recipient) =>
            emailService.sendPaymentInvoiceEmail({
              recipient,
              trackingNumber: shipment.trackingNumber,
              itemName: shipment.itemName,
              amount: String(amountNum),
              reason: validated.reason,
              paidAt: payment.paidAt.toISOString(),
              invoiceNumber: invoice?.invoiceNumber ?? payment.id,
              downloadUrl: downloadHref,
              invoiceHtml,
            }),
          ),
        );
      } catch (emailError) {
        console.error("Payment recorded but email failed:", emailError);
      }
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid payment payload" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Failed to record payment" }, { status: 400 });
  }
}
