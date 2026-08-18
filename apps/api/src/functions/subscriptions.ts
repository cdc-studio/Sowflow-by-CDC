import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { z } from "zod";
import { getSubscriptionsContainer } from "../services/cosmos";
import { captureAndFlush } from "../services/sentry";

function isCosmosNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 404;
}

const UpsertSubscriptionSchema = z.object({
  ownerId: z.string().min(1),
  stripeCustomerId: z.string().min(1),
  stripeSubscriptionId: z.string().optional(),
  status: z.string(),
  priceId: z.string().optional(),
  trialEnd: z.string().optional(),
  currentPeriodEnd: z.string().optional(),
});

export async function upsertSubscription(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body = await request.json().catch(() => null);
    const parsed = UpsertSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return {
        status: 400,
        jsonBody: { error: "Invalid request body", details: parsed.error.flatten() },
      };
    }

    const container = await getSubscriptionsContainer();
    const doc = {
      id: parsed.data.ownerId,
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    await container.items.upsert(doc);
    return { status: 200, jsonBody: doc };
  } catch (error) {
    context.error("upsertSubscription failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to upsert subscription" } };
  }
}

app.http("upsertSubscription", {
  methods: ["POST"],
  authLevel: "function",
  route: "subscriptions",
  handler: upsertSubscription,
});

export async function getSubscription(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const ownerId = request.query.get("ownerId");
    if (!ownerId) {
      return { status: 400, jsonBody: { error: "ownerId query parameter is required" } };
    }

    const container = await getSubscriptionsContainer();
    try {
      const { resource } = await container.item(ownerId, ownerId).read();
      return { status: 200, jsonBody: resource ?? null };
    } catch (error) {
      if (isCosmosNotFound(error)) {
        return { status: 200, jsonBody: null };
      }
      throw error;
    }
  } catch (error) {
    context.error("getSubscription failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to fetch subscription" } };
  }
}

app.http("getSubscription", {
  methods: ["GET"],
  authLevel: "function",
  route: "subscriptions",
  handler: getSubscription,
});
