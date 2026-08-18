import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats, isAdmin } from "@/lib/adminStats";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    redirect("/dashboard/new");
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
