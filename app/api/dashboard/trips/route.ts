import { NextRequest, NextResponse } from "next/server";
import { tripSchema } from "@/lib/validations";
import { db } from "@/db";
import { trips, vessels } from "@/db/schema";
import { auth } from "@/lib/auth";
import { count, or, ilike, and, SQL, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20"));
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * pageSize;

    const conditions: SQL[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(trips.name, `%${search}%`),
          ilike(trips.origin, `%${search}%`),
          ilike(trips.destination, `%${search}%`),
        ) as SQL,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.trips.findMany({
      where: whereClause,
      with: { vessel: true },
      orderBy: [desc(trips.createdAt)],
      limit: pageSize,
      offset,
    });

    const [countResult] = await db
      .select({ value: count() })
      .from(trips)
      .where(whereClause);
    const total = Number(countResult.value);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get trips error:", error);
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
    const validatedData = tripSchema.parse(body);

    const [trip] = await db
      .insert(trips)
      .values({
        name: validatedData.name,
        vesselId: validatedData.vesselId ?? null,
        origin: validatedData.origin ?? null,
        destination: validatedData.destination ?? null,
        departureDate: validatedData.departureDate ?? null,
        arrivalDate: validatedData.arrivalDate ?? null,
        notes: validatedData.notes ?? null,
        status: "pending",
      })
      .returning();

    // Fetch with vessel relation
    const tripWithVessel = await db.query.trips.findFirst({
      where: (t, { eq }) => eq(t.id, trip.id),
      with: { vessel: true },
    });

    return NextResponse.json({ trip: tripWithVessel }, { status: 201 });
  } catch (error) {
    console.error("Create trip error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
