import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/authUser";

export const runtime = "nodejs";

function functionsUrl(path: string): URL {
  const baseUrl = process.env.AZURE_FUNCTIONS_API_URL;
  if (!baseUrl) {
    throw new Error("AZURE_FUNCTIONS_API_URL is not configured");
  }
  const url = new URL(path, baseUrl);
  const functionKey = process.env.AZURE_FUNCTIONS_KEY;
  if (functionKey) {
    url.searchParams.set("code", functionKey);
  }
  return url;
}

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = functionsUrl("/api/branding/logo-data-url");
    url.searchParams.set("ownerId", userId);
    const response = await fetch(url, { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("GET /api/branding/logo-data-url failed", error);
    return NextResponse.json({ error: "Failed to reach branding storage" }, { status: 502 });
  }
}
