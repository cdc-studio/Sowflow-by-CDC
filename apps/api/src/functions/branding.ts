import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { UpsertBrandingRequestSchema } from "@sowflow/shared-types";
import { getBrandingContainer } from "../services/cosmos";
import { downloadLogoAsDataUrl, uploadLogo } from "../services/blobStorage";
import { captureAndFlush } from "../services/sentry";

function isCosmosNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 404;
}

interface BrandingDoc {
  id: string;
  ownerId: string;
  companyName?: string;
  logoBlobName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  addressLine?: string;
  vatId?: string;
  updatedAt: string;
}

// logoBlobName is an internal storage detail — clients never need the raw
// blob path, only whether a logo exists (they fetch pixels via the
// logo-data-url endpoint, which resolves the blob name server-side).
function toBrandingDto(doc: BrandingDoc) {
  return {
    id: doc.id,
    ownerId: doc.ownerId,
    companyName: doc.companyName,
    hasLogo: Boolean(doc.logoBlobName),
    primaryColor: doc.primaryColor,
    secondaryColor: doc.secondaryColor,
    addressLine: doc.addressLine,
    vatId: doc.vatId,
    updatedAt: doc.updatedAt,
  };
}

export async function getBranding(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const ownerId = request.query.get("ownerId");
    if (!ownerId) {
      return { status: 400, jsonBody: { error: "ownerId query parameter is required" } };
    }

    const container = await getBrandingContainer();
    try {
      const { resource } = await container.item(ownerId, ownerId).read();
      return { status: 200, jsonBody: resource ? toBrandingDto(resource) : null };
    } catch (error) {
      if (isCosmosNotFound(error)) {
        return { status: 200, jsonBody: null };
      }
      throw error;
    }
  } catch (error) {
    context.error("getBranding failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to fetch branding" } };
  }
}

app.http("getBranding", {
  methods: ["GET"],
  authLevel: "function",
  route: "branding",
  handler: getBranding,
});

const MAX_LOGO_BYTES = 3 * 1024 * 1024;

export async function upsertBranding(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body = await request.json().catch(() => null);
    const parsed = UpsertBrandingRequestSchema.safeParse(body);
    if (!parsed.success) {
      return {
        status: 400,
        jsonBody: { error: "Invalid request body", details: parsed.error.flatten() },
      };
    }

    const { ownerId, logo, ...fields } = parsed.data;
    let logoBlobName: string | undefined;

    if (logo) {
      const buffer = Buffer.from(logo.dataBase64, "base64");
      if (buffer.byteLength > MAX_LOGO_BYTES) {
        return { status: 400, jsonBody: { error: "Logo must be 3MB or smaller" } };
      }
      logoBlobName = await uploadLogo(ownerId, logo.fileName, logo.contentType, buffer);
    }

    const container = await getBrandingContainer();
    let existing: BrandingDoc | undefined;
    try {
      const { resource } = await container.item(ownerId, ownerId).read();
      existing = resource;
    } catch (error) {
      if (!isCosmosNotFound(error)) throw error;
    }

    const doc: BrandingDoc = {
      id: ownerId,
      ownerId,
      ...fields,
      logoBlobName: logoBlobName ?? existing?.logoBlobName,
      updatedAt: new Date().toISOString(),
    };

    await container.items.upsert(doc);
    return { status: 200, jsonBody: toBrandingDto(doc) };
  } catch (error) {
    context.error("upsertBranding failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to save branding" } };
  }
}

app.http("upsertBranding", {
  methods: ["POST"],
  authLevel: "function",
  route: "branding",
  handler: upsertBranding,
});

export async function getBrandingLogoDataUrl(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const ownerId = request.query.get("ownerId");
    if (!ownerId) {
      return { status: 400, jsonBody: { error: "ownerId query parameter is required" } };
    }

    const container = await getBrandingContainer();
    let logoBlobName: string | undefined;
    try {
      const { resource } = await container.item(ownerId, ownerId).read();
      logoBlobName = resource?.logoBlobName;
    } catch (error) {
      if (!isCosmosNotFound(error)) throw error;
    }

    if (!logoBlobName) {
      return { status: 200, jsonBody: { dataUrl: null } };
    }

    const dataUrl = await downloadLogoAsDataUrl(logoBlobName);
    return { status: 200, jsonBody: { dataUrl } };
  } catch (error) {
    context.error("getBrandingLogoDataUrl failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to fetch logo" } };
  }
}

app.http("getBrandingLogoDataUrl", {
  methods: ["GET"],
  authLevel: "function",
  route: "branding/logo-data-url",
  handler: getBrandingLogoDataUrl,
});
