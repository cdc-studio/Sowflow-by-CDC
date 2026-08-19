import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HelpCenterClient } from "@/components/help/HelpCenterClient";
import { getAuthUserId } from "@/lib/authUser";
import { getPublishedTutorials } from "@/lib/tutorials";

export const dynamic = "force-dynamic";

export default async function HelpCenterPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const [userId, tutorials] = await Promise.all([getAuthUserId(), getPublishedTutorials()]);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href={userId ? "/dashboard" : "/sign-in"}>{userId ? "Back to Dashboard" : "Sign in"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Help Center</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Short video walkthroughs for getting the most out of SOWFlow — from your first SOW to
          branding and billing.
        </p>

        <div className="mt-8">
          {tutorials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tutorials are published yet — check back soon.
            </p>
          ) : (
            <HelpCenterClient tutorials={tutorials} initialQuery={searchParams.q} />
          )}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} SOWFlow. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
