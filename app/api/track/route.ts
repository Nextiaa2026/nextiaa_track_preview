import { NextRequest, NextResponse } from "next/server";
import { trackingSchema } from "@/lib/validations";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingNumber } = trackingSchema.parse(body);

    // Support lookup by tracking number OR chassis number
    const shipment = await db.query.shipments.findFirst({
      where: or(
        eq(shipments.trackingNumber, trackingNumber),
        eq(shipments.chassisNumber, trackingNumber),
      ),
      with: {
        sender: true,
        receiver: true,
        trip: {
          with: {
            vessel: true,
            logs: {
              orderBy: (logs, { desc }) => [desc(logs.timestamp)],
            },
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const tripLogs = shipment.trip?.logs ?? [];

    return NextResponse.json({
      trackingNumber: shipment.trackingNumber,
      chassisNumber: shipment.chassisNumber,
      status: shipment.status,
      itemName: shipment.itemName,
      itemDescription: shipment.itemDescription,
      itemImage: shipment.itemImage,
      tripName: shipment.trip?.name ?? null,
      vesselName: shipment.trip?.vessel?.name ?? null,
      vesselImo: shipment.trip?.vessel?.imo ?? null,
      sender: {
        name: shipment.sender.name,
        email: shipment.sender.email,
        phone: shipment.sender.phone,
      },
      receiver: {
        name: shipment.receiver.name,
        email: shipment.receiver.email,
        phone: shipment.receiver.phone,
      },
      logs: tripLogs.map((log) => ({
        id: log.id,
        status: log.status,
        location: log.location,
        message: log.message,
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
