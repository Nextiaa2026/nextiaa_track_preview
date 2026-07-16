import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vessels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const vesselPatchSchema = z.object({
  carrierName: z.string().min(1).optional(),
  name: z.string().min(2).optional(),
  imo: z.string().min(3).optional(),
  type: z.string().min(2).optional(),
  lastKnownLat: z.number().min(-90).max(90).nullable().optional(),
  lastKnownLon: z.number().min(-180).max(180).nullable().optional(),
  isActive: z.boolean().optional(),
});

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
    const validatedData = vesselPatchSchema.parse(body);

    const [updated] = await db
      .update(vessels)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(vessels.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    return NextResponse.json({ vessel: updated });
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db.delete(vessels).where(eq(vessels.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vessel error:", error);
    return NextResponse.json({ error: "Failed to delete vessel" }, { status: 400 });
  }
}
