import type { ShipmentDocumentData } from "@/lib/documents/types";
import { buildAutoTransitInvoiceHtml } from "@/lib/documents/invoice-template";

/**
 * Payment receipt uses the same invoice layout (client request),
 * with a receipt-oriented title via invoice number prefix when needed.
 */
export function buildPaymentReceiptHtml(
  data: ShipmentDocumentData,
  paymentId?: string,
): string {
  const focused =
    paymentId && data.payments.length > 0
      ? {
          ...data,
          payments: data.payments.filter((p) => p.id === paymentId),
          invoiceNumber: data.invoiceNumber,
        }
      : data;

  return buildAutoTransitInvoiceHtml(focused);
}

export function buildShipmentReceiptHtml(data: ShipmentDocumentData): string {
  return buildAutoTransitInvoiceHtml({
    ...data,
    invoiceNumber: data.receiptNumber || data.invoiceNumber,
  });
}
