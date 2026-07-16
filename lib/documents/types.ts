export type DocumentParty = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zipCode?: string;
};

export type DocumentPayment = {
  id: string;
  amount: number;
  reason: string;
  paidAt: string;
  notes?: string | null;
};

export type DocumentVessel = {
  carrierName: string;
  boatName: string;
  boatNumber: string;
};

export type ShipmentDocumentData = {
  invoiceNumber: string;
  receiptNumber?: string;
  issuedAt: string;
  currency: string;
  trackingNumber: string;
  chassisNumber: string;
  itemName: string;
  itemWeight?: string | null;
  itemDimensions?: string | null;
  registrationNumber?: string | null;
  purchaseValue?: string | null;
  shippingCost: number;
  status: string;
  tripName?: string | null;
  vessel?: DocumentVessel | null;
  sender: DocumentParty;
  receiver: DocumentParty;
  payments: DocumentPayment[];
  companyName: string;
};

export function formatVesselLabel(vessel?: DocumentVessel | null): string {
  if (!vessel) return "—";
  const parts = [vessel.carrierName, vessel.boatName].filter(Boolean);
  return parts.length > 0 ? parts.join(" — ") : vessel.boatNumber || "—";
}
