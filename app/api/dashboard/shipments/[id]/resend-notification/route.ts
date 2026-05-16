import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { shipments, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { emailService } from "@/services/email.service";
import { buildReceiptHtml } from "@/lib/print-shipment-documents";
import { buildInvoiceHtml } from "@/lib/invoice";
import { getStatusDisplay } from "@/lib/utils/shipment";

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
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const receipt = {
      receiptNumber: `RCPT-${shipment.id}`,
      issuedAt: new Date().toISOString(),
      shipment: {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        chassisNumber: shipment.chassisNumber,
        itemName: shipment.itemName,
        itemWeight: shipment.itemWeight || "N/A",
        status: shipment.status,
        createdAt: shipment.createdAt.toISOString(),
        shippingCost: shipment.shippingCost,
      },
      sender: shipment.sender,
      receiver: shipment.receiver,
    };

    const receiptHtml = buildReceiptHtml(receipt);
    const invoiceHtml = buildInvoiceHtml(receipt);
    const statusSummary = `Rappel : L'expédition ${shipment.trackingNumber} est actuellement ${getStatusDisplay(shipment.status)}.`;
    
    const recipients = [
      { name: shipment.sender.name, email: shipment.sender.email },
      { name: shipment.receiver.name, email: shipment.receiver.email },
    ];

    await Promise.all(
      recipients.map((recipient) =>
        emailService.sendShipmentPacketEmail({
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
          receiptHtml,
          invoiceHtml,
        }),
      ),
    );

    return NextResponse.json({ message: "Notifications resent successfully" });
  } catch (error) {
    console.error("Resend notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
