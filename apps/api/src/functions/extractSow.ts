import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import {
  denullifyModelOutput,
  ExtractSowRequestSchema,
  SowExtractionSchema,
  sowExtractionJsonSchema,
} from "@sowflow/shared-types";
import { getOpenAIClient, getDeploymentName } from "../services/openai";
import { captureAndFlush } from "../services/sentry";
import { recordUsage } from "../services/usage";

const SYSTEM_PROMPT = `You are the extraction engine for SOWFlow, a tool that turns client discovery-call transcripts into a Statement of Work (SOW).

Rules:
- The transcript mixes business discussion with casual small talk (greetings, weather, scheduling chit-chat, technical difficulties). Ignore small talk entirely; extract only content relevant to project scope, deliverables, pricing, timelines, and responsibilities.
- The transcript may be in any language. Detect the primary language spoken and report it as a BCP-47 tag in "sourceLanguage". Regardless of source language, write every extracted field in English so the agency gets a unified English SOW.
- Populate "outOfScope" with anything the parties explicitly excluded, or anything that should be made explicit to prevent scope creep later.
- Populate "riskFlags" with vague client promises, undefined requirements, or ambiguous commitments that could cause scope creep or payment disputes later (e.g. "we'll figure out design later", "a few extra revisions won't be a problem"). Quote the transcript as closely as possible in "quote", explain the risk in "risk", and rate "severity" as low/medium/high. If nothing risky was said, return an empty array — do not invent risks.
- Never invent numbers, dates, or commitments that were not stated or clearly implied in the transcript.
- Output must strictly match the provided JSON schema.`;

export async function extractSow(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const rawBody = await request.json().catch(() => null);
    const parsedBody = ExtractSowRequestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return {
        status: 400,
        jsonBody: {
          error: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
      };
    }

    const { transcript } = parsedBody.data;
    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: getDeploymentName(),
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: transcript },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "SowExtraction",
          schema: sowExtractionJsonSchema,
          strict: true,
        },
      },
    });

    if (completion.usage) {
      await recordUsage(completion.usage.prompt_tokens, completion.usage.completion_tokens);
    }

    const message = completion.choices[0]?.message;

    if (message?.refusal) {
      return {
        status: 422,
        jsonBody: { error: "Extraction refused by model", reason: message.refusal },
      };
    }

    if (!message?.content) {
      return {
        status: 502,
        jsonBody: { error: "Model returned no content" },
      };
    }

    const rawExtraction = denullifyModelOutput(JSON.parse(message.content));
    const validated = SowExtractionSchema.safeParse(rawExtraction);

    if (!validated.success) {
      context.error("extractSow: model output failed schema validation", validated.error);
      await captureAndFlush(validated.error);
      return {
        status: 502,
        jsonBody: { error: "Model output did not match the expected SOW schema" },
      };
    }

    return { status: 200, jsonBody: validated.data };
  } catch (error) {
    context.error("extractSow failed", error);
    await captureAndFlush(error);
    return {
      status: 500,
      jsonBody: { error: "Failed to extract SOW from transcript" },
    };
  }
}

app.http("extractSow", {
  methods: ["POST"],
  authLevel: "function",
  route: "extract-sow",
  handler: extractSow,
});
