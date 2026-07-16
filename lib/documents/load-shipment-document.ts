import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices, shipments } from "@/db/schema";
import type { ShipmentDocumentData } from "@/lib/documents/types";
import { loadSystemSettings } from "@/lib/utils/currency";

type LoadOptions = {
  invoiceId?: string;
  invoiceNumber?: string;
};

function companyNameFromSettings(): string {
  try {
    return loadSystemSettings().companyName || "2NP";
  } catch {
    return "2NP";
  }
}

export async function loadShipmentDocumentData(
  shipmentId: string,
  options: LoadOptions = {},
): Promise<ShipmentDocumentData | null> {
  const shipment = await db.query.shipments.findFirst({
    where: eq(shipments.id, shipmentId),
    with: {
      sender: true,
      receiver: true,
      payments: true,
      invoices: true,
      trip: {
        with: { vessel: true },
      },
    },
  });

  if (!shipment) return null;

  let invoice =
    options.invoiceId
      ? shipment.invoices.find((inv) => inv.id === options.invoiceId)
      : undefined;

  if (!invoice && options.invoiceNumber) {
    invoice = shipment.invoices.find((inv) => inv.invoiceNumber === options.invoiceNumber);
  }

  if (!invoice) {
    invoice = [...shipment.invoices].sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
    )[0];
  }

  if (!invoice) {
    const [fallback] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.shipmentId, shipmentId))
      .limit(1);
    if (fallback) invoice = fallback as typeof shipment.invoices[number];
  }

  const vessel = shipment.trip?.vessel;
  const payments = [...(shipment.payments ?? [])]
    .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime())
    .map((p) => ({
      id: p.id,
      amount: Number(p.amount || 0),
      reason: p.reason,
      paidAt: p.paidAt instanceof Date ? p.paidAt.toISOString() : String(p.paidAt),
      notes: p.notes,
    }));

  return {
    invoiceNumber: invoice?.invoiceNumber ?? `INV-${shipment.id}`,
    receiptNumber: `RCP-${shipment.trackingNumber}`,
    issuedAt: (invoice?.issuedAt ?? shipment.createdAt) instanceof Date
      ? (invoice?.issuedAt ?? shipment.createdAt).toISOString()
      : String(invoice?.issuedAt ?? shipment.createdAt),
    currency: invoice?.currency ?? "EUR",
    trackingNumber: shipment.trackingNumber,
    chassisNumber: shipment.chassisNumber,
    itemName: shipment.itemName,
    itemWeight: shipment.itemWeight,
    itemDimensions: shipment.itemDimensions,
    shippingCost: Number(shipment.shippingCost || 0),
    status: shipment.status,
    tripName: shipment.trip?.name ?? null,
    vessel: vessel
      ? {
          carrierName: vessel.carrierName || "",
          boatName: vessel.name,
          boatNumber: vessel.imo,
        }
      : null,
    sender: {
      name: shipment.sender.name,
      email: shipment.sender.email,
      phone: shipment.sender.phone,
      address: shipment.sender.address,
      city: shipment.sender.city,
      country: shipment.sender.country,
      zipCode: shipment.sender.zipCode,
    },
    receiver: {
      name: shipment.receiver.name,
      email: shipment.receiver.email,
      phone: shipment.receiver.phone,
      address: shipment.receiver.address,
      city: shipment.receiver.city,
      country: shipment.receiver.country,
      zipCode: shipment.receiver.zipCode,
    },
    payments,
    companyName: companyNameFromSettings(),
  };
}
