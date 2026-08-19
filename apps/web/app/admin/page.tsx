import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats } from "@/lib/adminStats";
import { checkAdminAccess } from "@/lib/adminAuth";
import { getAuthUserId } from "@/lib/authUser";
import { AdminAccessDenied } from "@/components/AdminAccessDenied";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const userId = await getAuthUserId();
  const access = await checkAdminAccess(userId);
  if (!access.granted) {
    return <AdminAccessDenied result={access} />;
  }

  const stats = await getAdminStats();

  const tiles = [
    { label: "Total users", value: stats?.totalUsers ?? "—" },
    { label: "Total SOWs generated", value: stats?.totalSows ?? "—" },
    { label: "Active subscriptions", value: stats?.activeSubscriptions ?? "—" },
    {
      label: "Estimated OpenAI cost",
      value: stats ? `$${stats.estimatedOpenAiCostUsd.toFixed(2)}` : "—",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Admin</h1>
      {access.via === "dev-bypass" && (
        <p className="mt-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
          You&apos;re in via the dev admin bypass (ALLOW_DEV_ADMIN). Set ADMIN_USER_IDS or
          ADMIN_EMAILS to use real access control.
        </p>
      )}
      {!stats && (
        <p className="mt-2 text-sm text-muted-foreground">
          Stats are unavailable right now — check that the Azure Functions API is reachable.
        </p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{tile.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{tile.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
