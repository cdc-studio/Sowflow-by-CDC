import { BlobServiceClient } from "@azure/storage-blob";

let client: BlobServiceClient | undefined;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getClient(): BlobServiceClient {
  if (!client) {
    client = BlobServiceClient.fromConnectionString(requireEnv("AZURE_STORAGE_CONNECTION_STRING"));
  }
  return client;
}

function getLogosContainer() {
  return getClient().getContainerClient("logos");
}

/**
 * The storage account has public blob access disabled (confirmed against
 * the real account — most accounts disallow it by default/policy now), so
 * logos are never served by a bare URL. Every read goes through this same
 * account-key-authenticated client instead of an anonymous fetch.
 */
export async function uploadLogo(
  ownerId: string,
  fileName: string,
  contentType: string,
  data: Buffer,
): Promise<string> {
  const containerClient = getLogosContainer();
  await containerClient.createIfNotExists();

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobName = `${ownerId}/${crypto.randomUUID()}-${safeName}`;
  const blobClient = containerClient.getBlockBlobClient(blobName);
  await blobClient.uploadData(data, { blobHTTPHeaders: { blobContentType: contentType } });

  return blobName;
}

export async function downloadLogoAsDataUrl(blobName: string): Promise<string | null> {
  const blobClient = getLogosContainer().getBlockBlobClient(blobName);
  const exists = await blobClient.exists();
  if (!exists) {
    return null;
  }

  const download = await blobClient.download();
  const stream = download.readableStreamBody;
  if (!stream) {
    return null;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const buffer = Buffer.concat(chunks);
  const contentType = download.contentType ?? "image/png";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
