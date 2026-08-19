import { NextRequest, NextResponse } from "next/server";
import { UpsertBrandingRequestSchema } from "@sowflow/shared-types";
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
    const url = functionsUrl("/api/branding");
    url.searchParams.set("ownerId", userId);
    const response = await fetch(url, { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("GET /api/branding failed", error);
    return NextResponse.json({ error: "Failed to reach branding storage" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = UpsertBrandingRequestSchema.omit({ ownerId: true }).safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid branding payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(functionsUrl("/api/branding"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: userId, ...parsed.data }),
    });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("POST /api/branding failed", error);
    return NextResponse.json({ error: "Failed to reach branding storage" }, { status: 502 });
  }
}
