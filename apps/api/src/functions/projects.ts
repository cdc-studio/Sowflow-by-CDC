import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import {
  CreateProjectRequestSchema,
  UpdateProjectRequestSchema,
} from "@sowflow/shared-types";
import { getProjectsContainer } from "../services/cosmos";
import { captureAndFlush } from "../services/sentry";

function isCosmosNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 404;
}

interface ProjectRecord {
  id: string;
  ownerId: string;
  extraction: unknown;
  createdAt: string;
  updatedAt: string;
}

// Cosmos documents carry internal metadata (_rid, _self, _etag, _ts, ...)
// alongside the fields we wrote — strip it before it leaks to clients.
function toProjectDto(doc: ProjectRecord): ProjectRecord {
  return {
    id: doc.id,
    ownerId: doc.ownerId,
    extraction: doc.extraction,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createProject(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body = await request.json().catch(() => null);
    const parsed = CreateProjectRequestSchema.safeParse(body);
    if (!parsed.success) {
      return {
        status: 400,
        jsonBody: { error: "Invalid request body", details: parsed.error.flatten() },
      };
    }

    const container = await getProjectsContainer();
    const now = new Date().toISOString();
    const doc = {
      id: crypto.randomUUID(),
      ownerId: parsed.data.ownerId,
      extraction: parsed.data.extraction,
      createdAt: now,
      updatedAt: now,
    };
    await container.items.create(doc);
    return { status: 201, jsonBody: doc };
  } catch (error) {
    context.error("createProject failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to create project" } };
  }
}

app.http("createProject", {
  methods: ["POST"],
  authLevel: "function",
  route: "projects",
  handler: createProject,
});

export async function listProjects(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const ownerId = request.query.get("ownerId");
    if (!ownerId) {
      return { status: 400, jsonBody: { error: "ownerId query parameter is required" } };
    }

    const container = await getProjectsContainer();
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.ownerId = @ownerId ORDER BY c.updatedAt DESC",
        parameters: [{ name: "@ownerId", value: ownerId }],
      })
      .fetchAll();

    return { status: 200, jsonBody: resources.map(toProjectDto) };
  } catch (error) {
    context.error("listProjects failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to list projects" } };
  }
}

app.http("listProjects", {
  methods: ["GET"],
  authLevel: "function",
  route: "projects",
  handler: listProjects,
});

export async function getProject(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const ownerId = request.query.get("ownerId");
    if (!id || !ownerId) {
      return {
        status: 400,
        jsonBody: { error: "id route parameter and ownerId query parameter are required" },
      };
    }

    const container = await getProjectsContainer();
    try {
      const { resource } = await container.item(id, ownerId).read();
      if (!resource) {
        return { status: 404, jsonBody: { error: "Project not found" } };
      }
      return { status: 200, jsonBody: toProjectDto(resource) };
    } catch (error) {
      if (isCosmosNotFound(error)) {
        return { status: 404, jsonBody: { error: "Project not found" } };
      }
      throw error;
    }
  } catch (error) {
    context.error("getProject failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to fetch project" } };
  }
}

app.http("getProject", {
  methods: ["GET"],
  authLevel: "function",
  route: "projects/{id}",
  handler: getProject,
});

export async function updateProject(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    if (!id) {
      return { status: 400, jsonBody: { error: "id route parameter is required" } };
    }

    const body = await request.json().catch(() => null);
    const parsed = UpdateProjectRequestSchema.safeParse(body);
    if (!parsed.success) {
      return {
        status: 400,
        jsonBody: { error: "Invalid request body", details: parsed.error.flatten() },
      };
    }

    const container = await getProjectsContainer();
    let existing;
    try {
      const { resource } = await container.item(id, parsed.data.ownerId).read();
      existing = resource;
    } catch (error) {
      if (isCosmosNotFound(error)) {
        return { status: 404, jsonBody: { error: "Project not found" } };
      }
      throw error;
    }
    if (!existing) {
      return { status: 404, jsonBody: { error: "Project not found" } };
    }

    const updated = {
      ...toProjectDto(existing),
      extraction: parsed.data.extraction,
      updatedAt: new Date().toISOString(),
    };
    const { resource } = await container.item(id, parsed.data.ownerId).replace(updated);
    return { status: 200, jsonBody: resource ? toProjectDto(resource) : updated };
  } catch (error) {
    context.error("updateProject failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to update project" } };
  }
}

app.http("updateProject", {
  methods: ["PUT"],
  authLevel: "function",
  route: "projects/{id}",
  handler: updateProject,
});
