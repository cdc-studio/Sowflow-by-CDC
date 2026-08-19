import { clerkClient } from "@clerk/nextjs/server";
import { isClerkConfigured } from "./clerkConfig";

export type AdminAccessResult =
  | { granted: true; via: "allowlist" | "dev-bypass" }
  | {
      granted: false;
      reason: "clerk-not-configured" | "signed-out" | "not-admin";
      userId: string | null;
      email: string | null;
    };

// Local/setup escape hatch so a fresh deployment isn't a hard lockout before
// ADMIN_USER_IDS/ADMIN_EMAILS is populated. Gated to non-production so it
// can never accidentally leave a live deployment's /admin route open.
function isDevBypassEnabled(): boolean {
  return process.env.ALLOW_DEV_ADMIN === "true" && process.env.NODE_ENV !== "production";
}

function parseList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function checkAdminAccess(userId: string | null): Promise<AdminAccessResult> {
  if (!isClerkConfigured()) {
    if (isDevBypassEnabled()) return { granted: true, via: "dev-bypass" };
    return { granted: false, reason: "clerk-not-configured", userId: null, email: null };
  }

  if (!userId) {
    if (isDevBypassEnabled()) return { granted: true, via: "dev-bypass" };
    return { granted: false, reason: "signed-out", userId: null, email: null };
  }

  const adminIds = parseList(process.env.ADMIN_USER_IDS);
  if (adminIds.includes(userId)) return { granted: true, via: "allowlist" };

  const client = await clerkClient();
  const user = await client.users.getUser(userId).catch(() => null);
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const adminEmails = parseList(process.env.ADMIN_EMAILS).map((value) => value.toLowerCase());
  if (email && adminEmails.includes(email.toLowerCase())) {
    return { granted: true, via: "allowlist" };
  }

  if (isDevBypassEnabled()) return { granted: true, via: "dev-bypass" };

  return { granted: false, reason: "not-admin", userId, email };
}
