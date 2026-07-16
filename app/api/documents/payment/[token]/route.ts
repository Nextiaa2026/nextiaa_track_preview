import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { loadShipmentDocumentData } from "@/lib/documents/load-shipment-document";
import { buildPaymentReceiptHtml } from "@/lib/documents/receipt-template";

/** Public download: payment receipt (same layout as invoice). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const payment = await db.query.payments.findFirst({
      where: eq(payments.downloadToken, token),
    });

    if (!payment) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const data = await loadShipmentDocumentData(payment.shipmentId, {
      invoiceId: payment.invoiceId ?? undefined,
    });

    if (!data) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const html = buildPaymentReceiptHtml(data, payment.id);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="recu-paiement-${payment.id.slice(0, 8)}.html"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Payment receipt download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
