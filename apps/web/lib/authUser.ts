import { auth } from "@clerk/nextjs/server";
import { isClerkConfigured } from "./clerkConfig";

/**
 * Every route that gates on the signed-in user should call this instead of
 * @clerk/nextjs/server's auth() directly. auth() assumes clerkMiddleware()
 * already ran and attached auth state to the request; when Clerk isn't
 * configured, middleware.ts skips Clerk entirely, and calling auth() in
 * that state throws ("clerkMiddleware() was not run"). This degrades to
 * "nobody is signed in" instead, so callers just see a 401 like any other
 * signed-out request rather than a 500.
 */
export async function getAuthUserId(): Promise<string | null> {
  if (!isClerkConfigured()) {
    return null;
  }
  const { userId } = await auth();
  return userId;
}
