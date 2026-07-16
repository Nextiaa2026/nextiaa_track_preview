import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadShipmentDocumentData } from "@/lib/documents/load-shipment-document";
import { buildAutoTransitInvoiceHtml } from "@/lib/documents/invoice-template";

/** Authenticated invoice HTML for a shipment (Facture button). */
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
    const data = await loadShipmentDocumentData(id);
    if (!data) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({
      html: buildAutoTransitInvoiceHtml(data),
      data,
    });
  } catch (error) {
    console.error("Shipment invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
