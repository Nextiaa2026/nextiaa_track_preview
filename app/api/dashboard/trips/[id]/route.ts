import { NextRequest, NextResponse } from "next/server";
import { tripPatchSchema } from "@/lib/validations";
import { db } from "@/db";
import { trips, shipments, tripLogs } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { emailService } from "@/services/email.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const trip = await db.query.trips.findFirst({
      where: eq(trips.id, id),
      with: {
        vessel: true,
        shipments: {
          with: { sender: true, receiver: true },
        },
        logs: {
          orderBy: (logs, { desc }) => [desc(logs.timestamp)],
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error("Get trip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = tripPatchSchema.parse(body);

    const previousTrip = await db.query.trips.findFirst({
      where: eq(trips.id, id),
    });
    if (!previousTrip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const { notifyRecipients, ...tripData } = validatedData;

    const [updated] = await db
      .update(trips)
      .set({ ...tripData, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // If status changed, cascade to all shipments in this trip
    if (validatedData.status && validatedData.status !== previousTrip.status) {
      const relatedShipments = await db.query.shipments.findMany({
        where: eq(shipments.tripId, id),
        with: { sender: true, receiver: true },
      });

      if (relatedShipments.length > 0) {
        // Update all shipments status
        await db
          .update(shipments)
          .set({ status: validatedData.status, updatedAt: new Date() })
          .where(eq(shipments.tripId, id));

        // Create a trip log entry for the status change
        const message = `Le statut du trajet "${updated.name}" est passé à ${validatedData.status}. Toutes les expéditions associées ont été mises à jour.`;
        await db.insert(tripLogs).values({
          tripId: id,
          status: validatedData.status,
          location: updated.origin ?? undefined,
          message,
        });

        // Notify parties if requested
        if (notifyRecipients) {
          for (const shipment of relatedShipments) {
            try {
              const recipients = [
                { name: shipment.sender.name, email: shipment.sender.email },
                { name: shipment.receiver.name, email: shipment.receiver.email },
              ];
              await Promise.all(
                recipients.map((recipient) =>
                  emailService.sendVesselStatusUpdateEmail({
                    recipient,
                    trackingNumber: shipment.trackingNumber,
                    vesselName: updated.name,
                    previousStatus: previousTrip.status,
                    newStatus: validatedData.status!,
                    message,
                  }),
                ),
              );
            } catch (emailError) {
              console.error(`Failed to notify parties for shipment ${shipment.id}:`, emailError);
            }
          }
        }
      }
    }

    const tripWithRelations = await db.query.trips.findFirst({
      where: eq(trips.id, id),
      with: { vessel: true },
    });

    return NextResponse.json({ trip: tripWithRelations });
  } catch (error) {
    console.error("Update trip error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Detach shipments from this trip before deleting
    await db
      .update(shipments)
      .set({ tripId: null, updatedAt: new Date() })
      .where(eq(shipments.tripId, id));

    const [deleted] = await db.delete(trips).where(eq(trips.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete trip error:", error);
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 400 });
  }
}
