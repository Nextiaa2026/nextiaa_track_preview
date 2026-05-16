import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, trips } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
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
        trip: { with: { vessel: true, logs: { orderBy: (l, { desc }) => [desc(l.timestamp)] } } },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({ shipment });
  } catch (error) {
    console.error("Get shipment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const { shipmentPatchSchema } = await import("@/lib/validations");
    const validatedData = shipmentPatchSchema.parse(body);

    let newStatus: string | undefined = undefined;
    if (validatedData.tripId !== undefined) {
      if (validatedData.tripId) {
        const trip = await db.query.trips.findFirst({
          where: eq(trips.id, validatedData.tripId),
        });
        if (trip) {
          newStatus = trip.status;
        }
      } else {
         // If detached, keep current status or reset to pending? 
         // For now, only sync if trip is provided.
      }
    }

    const patchData: Record<string, unknown> = {
      ...validatedData,
      updatedAt: new Date(),
    };

    if (newStatus && !validatedData.status) {
      patchData.status = newStatus;
    }

    const [updatedShipment] = await db
      .update(shipments)
      .set(patchData)
      .where(eq(shipments.id, id))
      .returning();

    if (!updatedShipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
      with: {
        sender: true,
        receiver: true,
        trip: { with: { vessel: true, logs: { orderBy: (l, { desc }) => [desc(l.timestamp)] } } },
      },
    });

    return NextResponse.json({ shipment });
  } catch (error) {
    console.error("Update shipment error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(shipments)
      .where(eq(shipments.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Shipment deleted successfully" });
  } catch (error) {
    console.error("Delete shipment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
