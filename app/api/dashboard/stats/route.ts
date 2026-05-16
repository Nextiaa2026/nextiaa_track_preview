import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { shipments, trips, tripLogs } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalShipmentsResult,
      deliveredShipmentsResult,
      inTransitShipmentsResult,
      failedShipmentsResult,
      totalTripsResult,
      totalTripLogsResult,
    ] = await Promise.all([
      db.select({ value: count() }).from(shipments),
      db.select({ value: count() }).from(shipments).where(eq(shipments.status, "delivered")),
      db.select({ value: count() }).from(shipments).where(eq(shipments.status, "in_transit")),
      db.select({ value: count() }).from(shipments).where(eq(shipments.status, "failed")),
      db.select({ value: count() }).from(trips),
      db.select({ value: count() }).from(tripLogs),
    ]);

    const totalShipments = Number(totalShipmentsResult[0]?.value ?? 0);
    const deliveredShipments = Number(deliveredShipmentsResult[0]?.value ?? 0);
    const inTransitShipments = Number(inTransitShipmentsResult[0]?.value ?? 0);
    const failedShipments = Number(failedShipmentsResult[0]?.value ?? 0);
    const totalTrips = Number(totalTripsResult[0]?.value ?? 0);
    const totalTripLogs = Number(totalTripLogsResult[0]?.value ?? 0);
    const deliverySuccessRate =
      totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0;

    return NextResponse.json({
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      failedShipments,
      totalTrips,
      totalTripLogs,
      clientTrackingViews: 0,
      resendEmailsSent: 0,
      resendEmailFailures: 0,
      deliverySuccessRate: Number(deliverySuccessRate.toFixed(1)),
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
