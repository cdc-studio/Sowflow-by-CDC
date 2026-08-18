import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SowExtractionSchema } from "@sowflow/shared-types";

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

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = functionsUrl(`/api/projects/${params.id}`);
    url.searchParams.set("ownerId", userId);
    const response = await fetch(url, { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("GET /api/projects/[id] failed", error);
    return NextResponse.json({ error: "Failed to reach project storage" }, { status: 502 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsedExtraction = SowExtractionSchema.safeParse(rawBody?.extraction);
  if (!parsedExtraction.success) {
    return NextResponse.json(
      { error: "Invalid SOW extraction payload", details: parsedExtraction.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(functionsUrl(`/api/projects/${params.id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: userId, extraction: parsedExtraction.data }),
    });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("PUT /api/projects/[id] failed", error);
    return NextResponse.json({ error: "Failed to reach project storage" }, { status: 502 });
  }
}
