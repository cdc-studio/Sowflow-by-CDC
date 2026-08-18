import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { z } from "zod";
import { transcribePcm } from "../services/speech";
import { captureAndFlush } from "../services/sentry";

const TranscribeRequestSchema = z.object({
  dataBase64: z.string().min(1),
});

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

interface ParsedWav {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  pcm: Buffer;
}

// Minimal RIFF/WAVE chunk walk — the client always emits a canonical WAV
// (RIFF/WAVE, "fmt ", "data", no extra chunks), but this walks chunk IDs
// rather than assuming fixed offsets in case that ever changes.
function parseWav(buffer: Buffer): ParsedWav {
  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Not a valid WAV file");
  }

  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let pcm: Buffer | undefined;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === "fmt ") {
      channels = buffer.readUInt16LE(chunkStart + 2);
      sampleRate = buffer.readUInt32LE(chunkStart + 4);
      bitsPerSample = buffer.readUInt16LE(chunkStart + 14);
    } else if (chunkId === "data") {
      pcm = buffer.subarray(chunkStart, chunkStart + chunkSize);
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (!pcm || !sampleRate || !bitsPerSample) {
    throw new Error("Malformed WAV file: missing fmt or data chunk");
  }

  return { sampleRate, channels, bitsPerSample, pcm };
}

export async function transcribeAudio(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body = await request.json().catch(() => null);
    const parsed = TranscribeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return {
        status: 400,
        jsonBody: { error: "Invalid request body", details: parsed.error.flatten() },
      };
    }

    const wavBuffer = Buffer.from(parsed.data.dataBase64, "base64");
    if (wavBuffer.byteLength > MAX_AUDIO_BYTES) {
      return { status: 400, jsonBody: { error: "Recording is too large (25MB limit)" } };
    }

    let wav: ParsedWav;
    try {
      wav = parseWav(wavBuffer);
    } catch {
      return { status: 400, jsonBody: { error: "Could not parse uploaded audio as WAV" } };
    }

    if (wav.bitsPerSample !== 16 || wav.channels !== 1) {
      return { status: 400, jsonBody: { error: "Expected 16-bit mono PCM WAV audio" } };
    }

    const transcript = await transcribePcm(wav.pcm, wav.sampleRate);

    if (!transcript) {
      return { status: 422, jsonBody: { error: "No speech was recognized in the recording" } };
    }

    return { status: 200, jsonBody: { transcript } };
  } catch (error) {
    context.error("transcribeAudio failed", error);
    await captureAndFlush(error);
    return { status: 500, jsonBody: { error: "Failed to transcribe audio" } };
  }
}

// Long recordings can run past a few minutes of synchronous recognition —
// host.json raises functionTimeout to accommodate that on a Consumption
// plan. This is still a sync request/response, not the async queue-based
// pipeline a full-length call recording would eventually need.
app.http("transcribeAudio", {
  methods: ["POST"],
  authLevel: "function",
  route: "transcribe-audio",
  handler: transcribeAudio,
});
