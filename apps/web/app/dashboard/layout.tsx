import type { ReactNode } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerkConfig";

// Every page under /dashboard is per-user and auth-gated — never cacheable
// static content — so it should never attempt static generation.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // <SignedIn>/<SignedOut>/<UserButton> need auth() during SSR just like a
  // direct auth() call does — they hit the same "clerkMiddleware() didn't
  // run" crash when Clerk isn't configured (middleware.ts skips Clerk
  // entirely in that case). Skip mounting them rather than crash the layout
  // every /dashboard/* page renders through.
  const clerkReady = isClerkConfigured();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/new" className="text-lg font-semibold">
              SOWFlow
            </Link>
            <Link href="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground">
              My SOWs
            </Link>
          </div>
          {clerkReady && (
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
