"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SubscriptionRecord {
  status: string;
  priceId?: string;
  trialEnd?: string;
  currentPeriodEnd?: string;
}

const PLANS = [
  { key: "starter", name: "Starter", price: "$29/mo" },
  { key: "pro", name: "Pro", price: "$79/mo" },
  { key: "enterprise", name: "Enterprise", price: "$199/mo" },
] as const;

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscriptions", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setSubscription(data ?? null))
      .catch(() => setError("Failed to load billing status."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubscribe(plan: string) {
    setPendingPlan(plan);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Failed to start checkout.");
        setPendingPlan(null);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("Failed to start checkout.");
      setPendingPlan(null);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Failed to open billing portal.");
        setPortalLoading(false);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("Failed to open billing portal.");
      setPortalLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Billing</h1>

      {!loading && subscription && (
        <Card className="mt-6">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge className="capitalize">{subscription.status}</Badge>
                {subscription.trialEnd && (
                  <span className="text-xs text-muted-foreground">
                    Trial ends {new Date(subscription.trialEnd).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={handleManageBilling} disabled={portalLoading}>
              {portalLoading ? "Opening…" : "Manage billing"}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.key}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-2xl font-semibold">{plan.price}</p>
              <p className="text-xs text-muted-foreground">7-day free trial</p>
              <Button
                onClick={() => handleSubscribe(plan.key)}
                disabled={pendingPlan !== null}
                className="mt-2"
              >
                {pendingPlan === plan.key ? "Redirecting…" : "Subscribe"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
