import type { ReactNode } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

// Every page under /dashboard is per-user and auth-gated — never cacheable
// static content — so it should never attempt static generation.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
        </div>
      </header>
      {children}
    </div>
  );
}
