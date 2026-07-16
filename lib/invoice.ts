import type { ShipmentReceipt } from "@/services/shipment.service";
import {
  buildAutoTransitInvoiceHtml,
  buildInvoiceHtmlFromLegacyReceipt,
} from "@/lib/documents/invoice-template";
import type { DocumentPayment, DocumentVessel, ShipmentDocumentData } from "@/lib/documents/types";

export { buildAutoTransitInvoiceHtml };

type InvoiceOptions = {
  invoiceNumber?: string;
  issuedAt?: string;
  payments?: DocumentPayment[];
  vessel?: DocumentVessel | null;
  tripName?: string | null;
  companyName?: string;
};

/** Builds the AUTO TRANSIT–style invoice (Word template). */
export function buildInvoiceHtml(
  receipt: ShipmentReceipt | ShipmentDocumentData,
  options: InvoiceOptions = {},
): string {
  if ("invoiceNumber" in receipt && "shippingCost" in receipt && typeof receipt.shippingCost === "number") {
    return buildAutoTransitInvoiceHtml({
      ...receipt,
      invoiceNumber: options.invoiceNumber ?? receipt.invoiceNumber,
      issuedAt: options.issuedAt ?? receipt.issuedAt,
      payments: options.payments ?? receipt.payments,
      vessel: options.vessel !== undefined ? options.vessel : receipt.vessel,
      tripName: options.tripName !== undefined ? options.tripName : receipt.tripName,
      companyName: options.companyName ?? receipt.companyName,
    });
  }

  return buildInvoiceHtmlFromLegacyReceipt(receipt as ShipmentReceipt, options);
}
