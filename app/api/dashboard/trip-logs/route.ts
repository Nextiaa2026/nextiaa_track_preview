import { NextRequest, NextResponse } from "next/server";
import { tripLogSchema } from "@/lib/validations";
import { db } from "@/db";
import { tripLogs, trips, shipments } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, count, gte, lte, and, inArray, SQL, desc } from "drizzle-orm";

function parseSafeDate(val: string | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1"));
    const pageSize = Math.min(100, parseInt(sp.get("pageSize") || "10"));
    const tripId = sp.get("tripId") || undefined;
    const statusParam = sp.get("status") || undefined;
    const startDateParam = sp.get("startDate") || null;
    const endDateParam = sp.get("endDate") || null;
    const offset = (page - 1) * pageSize;

    const conditions: SQL[] = [];

    if (tripId) conditions.push(eq(tripLogs.tripId, tripId));

    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        conditions.push(inArray(tripLogs.status, statuses));
      }
    }

    const startDate = parseSafeDate(startDateParam);
    const endDate = parseSafeDate(endDateParam);
    if (startDate) conditions.push(gte(tripLogs.timestamp, startDate));
    if (endDate) conditions.push(lte(tripLogs.timestamp, endDate));

    const whereClause =
      conditions.length > 1
        ? and(...conditions)
        : conditions.length === 1
          ? conditions[0]
          : undefined;

    const logs = await db.query.tripLogs.findMany({
      where: whereClause,
      with: { trip: true },
      orderBy: [desc(tripLogs.timestamp)],
      limit: pageSize,
      offset,
    });

    const [countResult] = await db
      .select({ value: count() })
      .from(tripLogs)
      .where(whereClause);
    const total = Number(countResult.value);

    return NextResponse.json({
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get trip logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = tripLogSchema.parse(body);

    const trip = await db.query.trips.findFirst({
      where: eq(trips.id, validatedData.tripId),
    });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const [log] = await db
      .insert(tripLogs)
      .values({
        tripId: validatedData.tripId,
        status: validatedData.status,
        location: validatedData.location ?? null,
        address: validatedData.address ?? null,
        message: validatedData.message,
      })
      .returning();

    // Update trip status to match the log
    await db
      .update(trips)
      .set({ status: validatedData.status, updatedAt: new Date() })
      .where(eq(trips.id, validatedData.tripId));

    // Cascade status update to all shipments associated with this trip
    await db
      .update(shipments)
      .set({ status: validatedData.status, updatedAt: new Date() })
      .where(eq(shipments.tripId, validatedData.tripId));

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("Add trip log error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
