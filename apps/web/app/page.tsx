import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, FileText, Mic, Palette, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAuthUserId } from "@/lib/authUser";

// Without this, Next.js decides at build time whether this page is static
// or dynamic based on whether auth() actually got called during that build
// — which depends on Clerk env vars being present in that specific build
// environment. Forcing dynamic makes the signed-in redirect work reliably
// regardless of what the build environment happened to have configured.
export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: FileText,
    title: "AI-Extracted SOWs",
    desc: "Paste a discovery-call transcript and get a structured Statement of Work — objectives, deliverables, milestones — in seconds.",
  },
  {
    icon: AlertTriangle,
    title: "Scope Creep Detection",
    desc: "Vague client promises get flagged automatically, with severity ratings, before they turn into disputes.",
  },
  {
    icon: Mic,
    title: "Record Live Meetings",
    desc: "Capture the call directly in your browser and let SOWFlow transcribe and draft while you talk.",
  },
  {
    icon: Wallet,
    title: "Pricing, Extracted",
    desc: "Fixed fee, hourly, or retainer — pricing structure and payment schedule pulled straight from the conversation.",
  },
  {
    icon: Palette,
    title: "White-Label Branding",
    desc: "Your logo, your colors, your letterhead — on every generated document and PDF export.",
  },
  {
    icon: ShieldCheck,
    title: "Built for Agencies",
    desc: "Team billing, per-user history, and an admin view into usage — ready for how agencies actually work.",
  },
];

export default async function HomePage() {
  const userId = await getAuthUserId();
  if (userId) {
    redirect("/dashboard/new");
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/new">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
        <span className="glow-border inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          AI-powered Statements of Work
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
          Turn discovery calls into
          <br />
          signed contracts in minutes.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          SOWFlow reads your call transcript and drafts a complete Statement of Work — deliverables,
          pricing, risks, and all — so your team stops losing an afternoon to admin work after every
          client call.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard/new">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-panel rounded-lg p-6">
              <span className="glow-border flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                <feature.icon className="h-5 w-5 text-primary" />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} SOWFlow. All rights reserved.</span>
          <Link href="/help" className="transition-colors hover:text-foreground">
            Help Center
          </Link>
        </div>
      </footer>
    </main>
  );
}
