import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { loadShipmentDocumentData } from "@/lib/documents/load-shipment-document";
import { buildAutoTransitInvoiceHtml } from "@/lib/documents/invoice-template";

/** Public download: email link → full invoice HTML (print / save as PDF). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.downloadToken, token),
    });

    if (!invoice) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const data = await loadShipmentDocumentData(invoice.shipmentId, {
      invoiceId: invoice.id,
    });

    if (!data) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const html = buildAutoTransitInvoiceHtml(data);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.html"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Invoice download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
