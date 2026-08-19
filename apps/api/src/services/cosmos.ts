import { Container, CosmosClient } from "@azure/cosmos";

let client: CosmosClient | undefined;
const containerCache = new Map<string, Container>();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getClient(): CosmosClient {
  if (!client) {
    client = new CosmosClient(requireEnv("COSMOS_DB_CONNECTION_STRING"));
  }
  return client;
}

function getDatabaseId(): string {
  return process.env.COSMOS_DB_DATABASE_NAME ?? "sowflow";
}

/**
 * createIfNotExists keeps local/dev setup friction-free without a separate
 * provisioning step. For a production rollout this should move to
 * infra-as-code instead of being created lazily on first request.
 */
async function getContainer(containerId: string, partitionKeyPath: string): Promise<Container> {
  const cached = containerCache.get(containerId);
  if (cached) {
    return cached;
  }

  const { database } = await getClient().databases.createIfNotExists({ id: getDatabaseId() });
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: [partitionKeyPath] },
  });

  containerCache.set(containerId, container);
  return container;
}

export function getProjectsContainer(): Promise<Container> {
  return getContainer("projects", "/ownerId");
}

export function getSubscriptionsContainer(): Promise<Container> {
  return getContainer("subscriptions", "/ownerId");
}

export function getUsageContainer(): Promise<Container> {
  return getContainer("usage", "/day");
}

export function getBrandingContainer(): Promise<Container> {
  return getContainer("branding", "/ownerId");
}

export function getTutorialsContainer(): Promise<Container> {
  return getContainer("tutorials", "/id");
}
