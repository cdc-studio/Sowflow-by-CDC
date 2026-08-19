import { NextResponse } from "next/server";
import { getAdminStats, isAdmin } from "@/lib/adminStats";
import { getAuthUserId } from "@/lib/authUser";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await getAdminStats();
  if (!stats) {
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 502 });
  }
  return NextResponse.json(stats);
}
