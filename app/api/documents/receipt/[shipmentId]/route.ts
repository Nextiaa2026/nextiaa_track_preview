import { NextRequest, NextResponse } from "next/server";
import { loadShipmentDocumentData } from "@/lib/documents/load-shipment-document";
import { buildShipmentReceiptHtml } from "@/lib/documents/receipt-template";
import { verifyReceiptDownloadToken } from "@/lib/documents/receipt-token";
import { htmlToPdf } from "@/lib/documents/render-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Public download: shipment receipt as a PDF file via signed token. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  try {
    const { shipmentId } = await params;
    const token = request.nextUrl.searchParams.get("token") ?? "";

    if (!token || !(await verifyReceiptDownloadToken(token, shipmentId))) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
    }

    const data = await loadShipmentDocumentData(shipmentId);
    if (!data) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const html = buildShipmentReceiptHtml(data);
    const pdf = await htmlToPdf(html);
    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recu-${data.trackingNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Receipt download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
