import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { loadShipmentDocumentData } from "@/lib/documents/load-shipment-document";
import { buildAutoTransitInvoiceHtml } from "@/lib/documents/invoice-template";

/** Authenticated print/preview of an invoice (dashboard). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const data = await loadShipmentDocumentData(invoice.shipmentId, {
      invoiceId: invoice.id,
    });

    if (!data) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({
      invoice,
      html: buildAutoTransitInvoiceHtml(data),
      data,
    });
  } catch (error) {
    console.error("Invoice print error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
