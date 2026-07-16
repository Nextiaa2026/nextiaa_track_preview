import { randomBytes } from "crypto";

/** Opaque download token for invoice / payment receipt links. */
export function createDownloadToken(): string {
  return randomBytes(24).toString("hex");
}

export function getAppBaseUrl(requestUrl?: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  if (requestUrl) {
    try {
      return new URL(requestUrl).origin;
    } catch {
      /* fall through */
    }
  }
  return "http://localhost:3000";
}

export function invoiceDownloadUrl(token: string, baseUrl?: string): string {
  return `${baseUrl ?? getAppBaseUrl()}/api/documents/invoice/${token}`;
}

export function paymentReceiptDownloadUrl(token: string, baseUrl?: string): string {
  return `${baseUrl ?? getAppBaseUrl()}/api/documents/payment/${token}`;
}

export function receiptDownloadUrl(shipmentId: string, token: string, baseUrl?: string): string {
  return `${baseUrl ?? getAppBaseUrl()}/api/documents/receipt/${shipmentId}?token=${encodeURIComponent(token)}`;
}
