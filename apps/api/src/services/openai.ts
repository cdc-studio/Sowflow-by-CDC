import { AzureOpenAI } from "openai";

let client: AzureOpenAI | undefined;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getOpenAIClient(): AzureOpenAI {
  if (client) {
    return client;
  }

  const endpoint = requireEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = requireEnv("AZURE_OPENAI_API_KEY");
  const deployment = requireEnv("AZURE_OPENAI_DEPLOYMENT_NAME");
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-08-01-preview";

  client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });
  return client;
}

export function getDeploymentName(): string {
  return requireEnv("AZURE_OPENAI_DEPLOYMENT_NAME");
}
