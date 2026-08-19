import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/adminStats";
import { checkAdminAccess } from "@/lib/adminAuth";
import { getAuthUserId } from "@/lib/authUser";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getAuthUserId();
  const access = await checkAdminAccess(userId);
  if (!access.granted) {
    return NextResponse.json({ error: "Forbidden", reason: access.reason }, { status: 403 });
  }

  const stats = await getAdminStats();
  if (!stats) {
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 502 });
  }
  return NextResponse.json(stats);
}
