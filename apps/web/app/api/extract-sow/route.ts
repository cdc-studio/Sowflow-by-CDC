import { NextRequest, NextResponse } from "next/server";
import { ExtractSowRequestSchema } from "@sowflow/shared-types";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 60_000;

/**
 * Proxies to the Azure Function `extractSow`. The function key never reaches
 * the browser: it's attached server-side from AZURE_FUNCTIONS_KEY, which has
 * no NEXT_PUBLIC_ prefix and is therefore inaccessible to client code.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  const parsedBody = ExtractSowRequestSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const baseUrl = process.env.AZURE_FUNCTIONS_API_URL;
  if (!baseUrl) {
    console.error("AZURE_FUNCTIONS_API_URL is not configured");
    return NextResponse.json(
      { error: "Server is not configured to reach the extraction service" },
      { status: 500 },
    );
  }

  const functionKey = process.env.AZURE_FUNCTIONS_KEY;
  const url = new URL("/api/extract-sow", baseUrl);
  if (functionKey) {
    url.searchParams.set("code", functionKey);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedBody.data),
      signal: controller.signal,
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        payload ?? { error: "Extraction service returned an error" },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error("extract-sow proxy failed", error);
    return NextResponse.json(
      { error: isAbort ? "Extraction timed out" : "Failed to reach extraction service" },
      { status: isAbort ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
