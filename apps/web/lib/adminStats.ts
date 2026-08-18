import { clerkClient } from "@clerk/nextjs/server";

export function isAdmin(userId: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return adminIds.includes(userId);
}

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

export interface AdminStats {
  totalUsers: number;
  totalSows: number;
  activeSubscriptions: number;
  estimatedOpenAiCostUsd: number;
}

export async function getAdminStats(): Promise<AdminStats | null> {
  try {
    const [statsResponse, client] = await Promise.all([
      fetch(functionsUrl("/api/internal/admin-stats"), { cache: "no-store" }),
      clerkClient(),
    ]);
    if (!statsResponse.ok) return null;

    const stats = await statsResponse.json();
    const totalUsers = await client.users.getCount();
    return { ...stats, totalUsers };
  } catch (error) {
    console.error("getAdminStats failed", error);
    return null;
  }
}
