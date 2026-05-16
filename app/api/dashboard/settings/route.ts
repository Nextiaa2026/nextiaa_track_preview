import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.query.appSettings.findMany({
    where: eq(appSettings.userId, session.user.id),
  });

  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, value } = await req.json();

  if (!key) {
    return NextResponse.json({ error: "Key is required" }, { status: 400 });
  }

  const userId = session.user.id;

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

  return NextResponse.json({ success: true });
}
