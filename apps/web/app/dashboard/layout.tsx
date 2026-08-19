import type { ReactNode } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerkConfig";
import { CommandPalette } from "@/components/CommandPalette";
import { CommandPaletteProvider } from "@/components/CommandPaletteProvider";
import { SearchTriggerButton } from "@/components/SearchTriggerButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/motion/PageTransition";

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
    <CommandPaletteProvider>
      <div className="min-h-screen bg-background">
        <header className="glass-panel sticky top-0 z-40 border-b">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-6">
              <Link href="/dashboard/new">
                <Logo />
              </Link>
              <nav className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
                <Link href="/dashboard/new" className="transition-colors hover:text-foreground">
                  New SOW
                </Link>
                <Link href="/dashboard/projects" className="transition-colors hover:text-foreground">
                  My SOWs
                </Link>
                <Link href="/dashboard/settings/billing" className="transition-colors hover:text-foreground">
                  Billing
                </Link>
                <Link href="/dashboard/settings/branding" className="transition-colors hover:text-foreground">
                  Branding
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <SearchTriggerButton />
              <ThemeToggle />
              {clerkReady && (
                <>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                        Sign in
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                </>
              )}
            </div>
          </div>
        </header>
        <CommandPalette />
        <PageTransition>{children}</PageTransition>
      </div>
    </CommandPaletteProvider>
  );
}
