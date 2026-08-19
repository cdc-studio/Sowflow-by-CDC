import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/authUser";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 8 * 60_000;

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  if (!rawBody?.dataBase64) {
    return NextResponse.json({ error: "dataBase64 is required" }, { status: 400 });
  }

  const baseUrl = process.env.AZURE_FUNCTIONS_API_URL;
  if (!baseUrl) {
    console.error("AZURE_FUNCTIONS_API_URL is not configured");
    return NextResponse.json({ error: "Transcription service is not configured" }, { status: 500 });
  }

  const url = new URL("/api/transcribe-audio", baseUrl);
  const functionKey = process.env.AZURE_FUNCTIONS_KEY;
  if (functionKey) {
    url.searchParams.set("code", functionKey);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataBase64: rawBody.dataBase64 }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error("transcribe-audio proxy failed", error);
    return NextResponse.json(
      { error: isAbort ? "Transcription timed out" : "Failed to reach transcription service" },
      { status: isAbort ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
