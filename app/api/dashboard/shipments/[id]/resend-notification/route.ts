import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { invoices, shipments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { emailService } from "@/services/email.service";
import { getStatusDisplay } from "@/lib/utils/shipment";
import {
  createDownloadToken,
  getAppBaseUrl,
  invoiceDownloadUrl,
  receiptDownloadUrl,
} from "@/lib/document-tokens";
import { signReceiptDownloadToken } from "@/lib/documents/receipt-token";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
      with: {
        sender: true,
        receiver: true,
        invoices: true,
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    let invoice = [...shipment.invoices].sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
    )[0];

    if (!invoice) {
      return NextResponse.json(
        { error: "No invoice found for this shipment" },
        { status: 404 },
      );
    }

    if (!invoice.downloadToken) {
      const token = createDownloadToken();
      const [updated] = await db
        .update(invoices)
        .set({ downloadToken: token, updatedAt: new Date() })
        .where(eq(invoices.id, invoice.id))
        .returning();
      invoice = updated;
    }

    const baseUrl = getAppBaseUrl(request.url);
    const receiptToken = await signReceiptDownloadToken(shipment.id);
    const statusSummary = `Rappel : L'expédition ${shipment.trackingNumber} est actuellement ${getStatusDisplay(shipment.status)}.`;

    const recipients = [
      { name: shipment.sender.name, email: shipment.sender.email },
      { name: shipment.receiver.name, email: shipment.receiver.email },
    ];

    await Promise.all(
      recipients.map((recipient) =>
        emailService.sendShipmentDocumentLinksEmail({
          recipient,
          trackingNumber: shipment.trackingNumber,
          itemName: shipment.itemName,
          senderName: shipment.sender.name,
          receiverName: shipment.receiver.name,
          estimatedDelivery: shipment.estimatedDelivery
            ? shipment.estimatedDelivery.toISOString()
            : undefined,
          status: shipment.status,
          statusSummary,
          invoiceDownloadUrl: invoiceDownloadUrl(invoice.downloadToken, baseUrl),
          receiptDownloadUrl: receiptDownloadUrl(shipment.id, receiptToken, baseUrl),
        }),
      ),
    );

    return NextResponse.json({ message: "Notifications resent successfully" });
  } catch (error) {
    console.error("Resend notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
