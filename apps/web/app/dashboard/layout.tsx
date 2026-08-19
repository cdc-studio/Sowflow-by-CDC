import type { ReactNode } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerkConfig";
import { CommandPalette } from "@/components/CommandPalette";
import { CommandPaletteProvider } from "@/components/CommandPaletteProvider";
import { SearchTriggerButton } from "@/components/SearchTriggerButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardNav } from "@/components/DashboardNav";
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
            <DashboardNav />
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
