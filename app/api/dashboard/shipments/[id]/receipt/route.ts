import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { eq } from "drizzle-orm";

function toReceiptNumber(trackingNumber: string, shipmentId: string): string {
  const suffix = shipmentId.split("-")[0].toUpperCase();
  return `RCP-${trackingNumber}-${suffix}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
      with: {
        sender: true,
        receiver: true,
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const receipt = {
      receiptNumber: toReceiptNumber(shipment.trackingNumber, shipment.id),
      issuedAt: new Date().toISOString(),
      shipment: {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        chassisNumber: shipment.chassisNumber,
        itemName: shipment.itemName,
        itemWeight: shipment.itemWeight || "N/A",
        status: shipment.status,
        createdAt: shipment.createdAt,
        shippingCost: shipment.shippingCost,
      },
      sender: {
        name: shipment.sender.name,
        email: shipment.sender.email,
        phone: shipment.sender.phone,
        address: shipment.sender.address,
        city: shipment.sender.city,
        country: shipment.sender.country,
      },
      receiver: {
        name: shipment.receiver.name,
        email: shipment.receiver.email,
        phone: shipment.receiver.phone,
        address: shipment.receiver.address,
        city: shipment.receiver.city,
        country: shipment.receiver.country,
      },
    };

    return NextResponse.json({ receipt }, { status: 201 });
  } catch (error) {
    console.error("Create receipt error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
