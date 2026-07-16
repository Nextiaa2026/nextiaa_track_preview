import { SignJWT, jwtVerify } from "jose";

const RECEIPT_TOKEN_TTL = "30d";

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.DOCUMENT_TOKEN_SECRET ||
    "nexiaa-document-fallback-secret"; // keep stable for existing tokens; override via AUTH_SECRET in prod
  return new TextEncoder().encode(secret);
}

export async function signReceiptDownloadToken(shipmentId: string): Promise<string> {
  return new SignJWT({ shipmentId, type: "receipt" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(RECEIPT_TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyReceiptDownloadToken(
  token: string,
  expectedShipmentId: string,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.type === "receipt" && payload.shipmentId === expectedShipmentId;
  } catch {
    return false;
  }
}
