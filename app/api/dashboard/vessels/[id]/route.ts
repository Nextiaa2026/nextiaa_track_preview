import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vessels, shipments, shipmentLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { emailService } from "@/services/email.service";

const vesselPatchSchema = z.object({
  name: z.string().min(2).optional(),
  imo: z.string().min(3).optional(),
  type: z.string().min(2).optional(),
  status: z.enum(["pending", "in_transit", "delivered", "failed"]).optional(),
  lastKnownLat: z.number().min(-90).max(90).nullable().optional(),
  lastKnownLon: z.number().min(-180).max(180).nullable().optional(),
  isActive: z.boolean().optional(),
  notifyRecipients: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = vesselPatchSchema.parse(body);

    const previousVessel = await db.query.vessels.findFirst({
      where: eq(vessels.id, id),
    });
    if (!previousVessel) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    const { notifyRecipients, ...vesselData } = validatedData;

    const updated = await db
      .update(vessels)
      .set({ ...vesselData, updatedAt: new Date() })
      .where(eq(vessels.id, id))
      .returning();

    if (!updated[0]) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    // If status changed, update all related shipments
    if (validatedData.status && validatedData.status !== previousVessel.status) {
      const relatedShipments = await db.query.shipments.findMany({
        where: eq(shipments.vesselId, id),
        with: {
          sender: true,
          receiver: true,
        },
      });

      if (relatedShipments.length > 0) {
        // Update all shipments status
        await db
          .update(shipments)
          .set({ status: validatedData.status, updatedAt: new Date() })
          .where(eq(shipments.vesselId, id));

        // Create logs for each shipment
        for (const shipment of relatedShipments) {
          const message = `Le statut du navire ${updated[0].name} est passé à ${validatedData.status}. Toutes les expéditions associées ont été mises à jour.`;
          
          await db.insert(shipmentLogs).values({
            shipmentId: shipment.id,
            status: validatedData.status,
            location: updated[0].name,
            message: message,
          });

          // Notify parties if requested
          if (notifyRecipients) {
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
                    vesselName: updated[0].name,
                    previousStatus: previousVessel.status,
                    newStatus: validatedData.status!,
                    message: message,
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

    return NextResponse.json({ vessel: updated[0] });
  } catch (error) {
    console.error("Update vessel error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid update payload" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Failed to update vessel" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Set vesselId to null in shipments that use this vessel
    await db
      .update(shipments)
      .set({ vesselId: null, updatedAt: new Date() })
      .where(eq(shipments.vesselId, id));

    const deleted = await db
      .delete(vessels)
      .where(eq(vessels.id, id))
      .returning();

    if (!deleted[0]) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vessel error:", error);
    return NextResponse.json({ error: "Failed to delete vessel" }, { status: 400 });
  }
}
