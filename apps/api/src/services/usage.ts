import { getUsageContainer } from "./cosmos";

/**
 * Best-effort: a failure to log usage should never fail the extraction
 * request itself, since the tokens were already billed by Azure regardless
 * of whether we successfully recorded them.
 */
export async function recordUsage(promptTokens: number, completionTokens: number): Promise<void> {
  try {
    const container = await getUsageContainer();
    const day = new Date().toISOString().slice(0, 10);
    await container.items.create({
      id: crypto.randomUUID(),
      day,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to record OpenAI usage", error);
  }
}
