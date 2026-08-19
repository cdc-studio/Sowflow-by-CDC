import type { Tutorial } from "@sowflow/shared-types";

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

export async function getPublishedTutorials(): Promise<Tutorial[]> {
  try {
    const url = functionsUrl("/api/tutorials");
    url.searchParams.set("publishedOnly", "true");
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()) as Tutorial[];
  } catch (error) {
    console.error("getPublishedTutorials failed", error);
    return [];
  }
}
