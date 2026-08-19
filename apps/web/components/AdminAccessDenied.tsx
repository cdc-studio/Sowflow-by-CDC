import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminAccessResult } from "@/lib/adminAuth";

type DeniedResult = Extract<AdminAccessResult, { granted: false }>;

const COPY: Record<DeniedResult["reason"], { title: string; description: string }> = {
  "clerk-not-configured": {
    title: "Setup required",
    description:
      "Clerk isn't configured for this deployment yet, so there's no way to verify who's an admin. Set CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, or use the dev bypass below while you finish setup.",
  },
  "signed-out": {
    title: "Sign in required",
    description: "You need to sign in before the admin dashboard can check your access.",
  },
  "not-admin": {
    title: "Access denied",
    description: "You're signed in, but your account isn't on the admin allowlist yet.",
  },
};

export function AdminAccessDenied({ result }: { result: DeniedResult }) {
  const copy = COPY[result.reason];

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          <CardTitle>{copy.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{copy.description}</p>

          {result.reason === "signed-out" && (
            <Link href="/sign-in" className="inline-block text-sm font-medium text-primary hover:underline">
              Go to sign in →
            </Link>
          )}

          {result.reason === "not-admin" && (
            <div className="rounded-md border bg-muted/40 p-3 font-mono text-xs">
              <p>
                userId: <span className="text-foreground">{result.userId}</span>
              </p>
              <p>
                email: <span className="text-foreground">{result.email ?? "(none on file)"}</span>
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="mb-2 font-medium text-foreground">To grant admin access</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>
                Fastest: set the <code className="text-foreground">ADMIN_EMAILS</code> env var to a
                comma-separated list of admin email addresses (or{" "}
                <code className="text-foreground">ADMIN_USER_IDS</code> with Clerk user IDs from the
                Clerk dashboard&apos;s Users tab), then redeploy.
              </li>
              <li>
                Or, in the{" "}
                <a
                  href="https://dashboard.clerk.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Clerk dashboard
                </a>
                , open your user under Users, copy their User ID, and add it to{" "}
                <code className="text-foreground">ADMIN_USER_IDS</code>.
              </li>
            </ol>
          </div>

          <div className="border-t pt-4">
            <p className="mb-2 font-medium text-foreground">Local/dev bypass</p>
            <p>
              While developing locally, set{" "}
              <code className="text-foreground">ALLOW_DEV_ADMIN=true</code> in your{" "}
              <code className="text-foreground">.env.local</code> to skip the allowlist check
              entirely. It only works when <code className="text-foreground">NODE_ENV</code> isn&apos;t{" "}
              <code className="text-foreground">production</code>, so it can never open this route on
              a real deployment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
