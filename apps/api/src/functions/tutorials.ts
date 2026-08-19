import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { UpsertTutorialRequestSchema } from "@sowflow/shared-types";
import { getTutorialsContainer } from "../services/cosmos";
import { captureAndFlush } from "../services/sentry";

function isCosmosNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 404;
}

interface TutorialRecord {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  videoUrl: string;
  category: string;
  order: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createTutorial(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body = await request.json().catch(() => null);
    const parsed = UpsertTutorialRequestSchema.safeParse(body);
    if (!parsed.success) {
      return {
        status: 400,
        jsonBody: { error: "Invalid request body", details: parsed.error.flatten() },
      };
    }

    const { published, ...fields } = parsed.data;
    const now = new Date().toISOString();
    const doc: TutorialRecord = {
      id: crypto.randomUUID(),
      ...fields,
      publishedAt: published ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    const container = await getTutorialsContainer();
    await container.items.create(doc);
    return { status: 201, jsonBody: doc };
  } catch (error) {
    context.error("createTutorial failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to create tutorial" } };
  }
}

app.http("createTutorial", {
  methods: ["POST"],
  authLevel: "function",
  route: "tutorials",
  handler: createTutorial,
});

export async function listTutorials(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const publishedOnly = request.query.get("publishedOnly") === "true";
    const container = await getTutorialsContainer();
    const query = publishedOnly
      ? "SELECT * FROM c WHERE c.publishedAt != null ORDER BY c.category ASC, c.order ASC"
      : "SELECT * FROM c ORDER BY c.category ASC, c.order ASC";
    const { resources } = await container.items.query<TutorialRecord>(query).fetchAll();

    return { status: 200, jsonBody: resources };
  } catch (error) {
    context.error("listTutorials failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to list tutorials" } };
  }
}

app.http("listTutorials", {
  methods: ["GET"],
  authLevel: "function",
  route: "tutorials",
  handler: listTutorials,
});

export async function updateTutorial(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    if (!id) {
      return { status: 400, jsonBody: { error: "id route parameter is required" } };
    }

    const body = await request.json().catch(() => null);
    const parsed = UpsertTutorialRequestSchema.safeParse(body);
    if (!parsed.success) {
      return {
        status: 400,
        jsonBody: { error: "Invalid request body", details: parsed.error.flatten() },
      };
    }

    const container = await getTutorialsContainer();
    let existing: TutorialRecord | undefined;
    try {
      const { resource } = await container.item(id, id).read<TutorialRecord>();
      existing = resource;
    } catch (error) {
      if (isCosmosNotFound(error)) {
        return { status: 404, jsonBody: { error: "Tutorial not found" } };
      }
      throw error;
    }
    if (!existing) {
      return { status: 404, jsonBody: { error: "Tutorial not found" } };
    }

    const { published, ...fields } = parsed.data;
    const updated: TutorialRecord = {
      ...existing,
      ...fields,
      publishedAt: published ? (existing.publishedAt ?? new Date().toISOString()) : null,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await container.item(id, id).replace(updated);
    return { status: 200, jsonBody: resource ?? updated };
  } catch (error) {
    context.error("updateTutorial failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to update tutorial" } };
  }
}

app.http("updateTutorial", {
  methods: ["PUT"],
  authLevel: "function",
  route: "tutorials/{id}",
  handler: updateTutorial,
});

export async function deleteTutorial(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    if (!id) {
      return { status: 400, jsonBody: { error: "id route parameter is required" } };
    }

    const container = await getTutorialsContainer();
    try {
      await container.item(id, id).delete();
    } catch (error) {
      if (isCosmosNotFound(error)) {
        return { status: 404, jsonBody: { error: "Tutorial not found" } };
      }
      throw error;
    }

    return { status: 204 };
  } catch (error) {
    context.error("deleteTutorial failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to delete tutorial" } };
  }
}

app.http("deleteTutorial", {
  methods: ["DELETE"],
  authLevel: "function",
  route: "tutorials/{id}",
  handler: deleteTutorial,
});
