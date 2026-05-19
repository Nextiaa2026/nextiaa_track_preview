import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, trips } from "@/db/schema";
import { auth } from "@/lib/auth";
import { inArray, eq, and } from "drizzle-orm";
import { z } from "zod";

const bulkAssignSchema = z.object({
  shipmentIds: z.array(z.string().uuid()).min(1, "At least one shipment required"),
  tripId: z.string().uuid().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { shipmentIds, tripId } = bulkAssignSchema.parse(body);

    if (tripId) {
      const deliveredShipments = await db.query.shipments.findMany({
        where: and(
          inArray(shipments.id, shipmentIds),
          eq(shipments.status, "delivered")
        ),
      });
      if (deliveredShipments.length > 0) {
        return NextResponse.json(
          { error: "Cannot allocate shipments that are already delivered to a trip" },
          { status: 400 }
        );
      }
    }

    let newStatus: string | undefined = undefined;

    if (tripId) {
      const trip = await db.query.trips.findFirst({
        where: eq(trips.id, tripId),
      });
      if (trip) {
        newStatus = trip.status;
      }
    }

    await db
      .update(shipments)
      .set({ 
        tripId, 
        ...(newStatus ? { status: newStatus } : {}),
        updatedAt: new Date() 
      })
      .where(inArray(shipments.id, shipmentIds));

    return NextResponse.json({ success: true, updated: shipmentIds.length });
  } catch (error) {
    console.error("Bulk assign error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to assign shipments" }, { status: 500 });
  }
}
