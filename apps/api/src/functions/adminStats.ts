import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getProjectsContainer, getSubscriptionsContainer, getUsageContainer } from "../services/cosmos";
import { captureAndFlush } from "../services/sentry";

// https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/
// gpt-4o pricing as of writing; override via env if pricing changes.
const GPT4O_INPUT_COST_PER_1K = Number(process.env.GPT4O_INPUT_COST_PER_1K ?? "0.0025");
const GPT4O_OUTPUT_COST_PER_1K = Number(process.env.GPT4O_OUTPUT_COST_PER_1K ?? "0.01");

export async function adminStats(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const projectsContainer = await getProjectsContainer();
    const subscriptionsContainer = await getSubscriptionsContainer();
    const usageContainer = await getUsageContainer();

    const { resources: totalSowsResult } = await projectsContainer.items
      .query<number>("SELECT VALUE COUNT(1) FROM c")
      .fetchAll();

    const { resources: activeSubsResult } = await subscriptionsContainer.items
      .query<number>("SELECT VALUE COUNT(1) FROM c WHERE c.status IN ('active', 'trialing')")
      .fetchAll();

    const { resources: usageResult } = await usageContainer.items
      .query<{ promptTokens: number | null; completionTokens: number | null }>(
        "SELECT SUM(c.promptTokens) AS promptTokens, SUM(c.completionTokens) AS completionTokens FROM c",
      )
      .fetchAll();

    const promptTokens = usageResult[0]?.promptTokens ?? 0;
    const completionTokens = usageResult[0]?.completionTokens ?? 0;
    const estimatedOpenAiCostUsd =
      (promptTokens / 1000) * GPT4O_INPUT_COST_PER_1K + (completionTokens / 1000) * GPT4O_OUTPUT_COST_PER_1K;

    return {
      status: 200,
      jsonBody: {
        totalSows: totalSowsResult[0] ?? 0,
        activeSubscriptions: activeSubsResult[0] ?? 0,
        promptTokens,
        completionTokens,
        estimatedOpenAiCostUsd: Math.round(estimatedOpenAiCostUsd * 100) / 100,
      },
    };
  } catch (error) {
    context.error("adminStats failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to compute admin stats" } };
  }
}

// Azure Functions reserves the "admin/*" route segment for its own runtime
// management API, so this can't live at "admin/stats" — it would 404 behind
// the host's built-in admin routes regardless of the "api/" prefix.
app.http("adminStats", {
  methods: ["GET"],
  authLevel: "function",
  route: "internal/admin-stats",
  handler: adminStats,
});
