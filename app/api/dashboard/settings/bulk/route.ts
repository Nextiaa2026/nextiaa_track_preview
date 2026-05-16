import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { settings } = await req.json();

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "Settings object is required" }, { status: 400 });
  }

  const userId = session.user.id;

  for (const [key, value] of Object.entries(settings)) {
    const existing = await db.query.appSettings.findFirst({
      where: and(
        eq(appSettings.userId, userId),
        eq(appSettings.key, key)
      ),
    });

    if (existing) {
      await db
        .update(appSettings)
        .set({ value: String(value), updatedAt: new Date() })
        .where(eq(appSettings.id, existing.id));
    } else {
      await db.insert(appSettings).values({
        userId,
        key,
        value: String(value),
      });
    }
  }

  return NextResponse.json({ success: true });
}
