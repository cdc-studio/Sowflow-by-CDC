import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isClerkConfigured } from "./lib/clerkConfig";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);

// clerkMiddleware() throws synchronously if Clerk isn't configured for this
// deployment (missing CLERK_SECRET_KEY / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY —
// e.g. a Vercel preview/production deployment that hasn't had its env vars
// set yet). Unlike ClerkProvider's local "keyless" dev fallback, the
// middleware has no such fallback outside `next dev`, so an unconfigured
// deployment turns into a hard 500 (MIDDLEWARE_INVOCATION_FAILED) on every
// single route, including the public marketing page. Detect that case up
// front and skip Clerk entirely rather than let it throw: auth-gated pages
// simply stop being protected until real keys are set, instead of the whole
// site going down. Every route/page that reads auth() downstream must use
// lib/authUser.ts's getAuthUserId() rather than calling auth() directly, or
// it hits the same crash one layer down (auth() assumes this middleware ran).
const withClerkAuth = isClerkConfigured()
  ? clerkMiddleware(async (auth, request) => {
      if (isProtectedRoute(request)) {
        await auth.protect();
      }
    })
  : null;

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!withClerkAuth) {
    return NextResponse.next();
  }

  try {
    return await withClerkAuth(request, event);
  } catch (error) {
    // Belt-and-suspenders: also swallow any *runtime* Clerk failure (e.g. an
    // unrecognized preview-deployment origin) rather than letting a single
    // bad request take the whole site down.
    console.error("Clerk middleware failed; continuing without auth for this request", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
