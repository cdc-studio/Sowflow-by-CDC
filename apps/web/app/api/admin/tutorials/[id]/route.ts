import { NextRequest, NextResponse } from "next/server";
import { UpsertTutorialRequestSchema } from "@sowflow/shared-types";
import { checkAdminAccess } from "@/lib/adminAuth";
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  const access = await checkAdminAccess(userId);
  if (!access.granted) {
    return NextResponse.json({ error: "Forbidden", reason: access.reason }, { status: 403 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = UpsertTutorialRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid tutorial payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(functionsUrl(`/api/tutorials/${params.id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("PUT /api/admin/tutorials/[id] failed", error);
    return NextResponse.json({ error: "Failed to reach tutorial storage" }, { status: 502 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  const access = await checkAdminAccess(userId);
  if (!access.granted) {
    return NextResponse.json({ error: "Forbidden", reason: access.reason }, { status: 403 });
  }

  try {
    const response = await fetch(functionsUrl(`/api/tutorials/${params.id}`), { method: "DELETE" });
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("DELETE /api/admin/tutorials/[id] failed", error);
    return NextResponse.json({ error: "Failed to reach tutorial storage" }, { status: 502 });
  }
}
