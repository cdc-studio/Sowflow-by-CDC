import * as sdk from "microsoft-cognitiveservices-speech-sdk";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Transcribes a mono 16-bit PCM buffer (no WAV/container header — the caller
 * strips that before calling this). The push-stream API only accepts raw
 * PCM; compressed formats (WebM/Opus, MP3, ...) would need GStreamer
 * installed on the host to decode, which Azure Functions doesn't have by
 * default. That's why the client converts to PCM WAV before uploading, and
 * why this only takes raw PCM rather than an arbitrary audio file.
 */
// Azure Speech has no built-in cap on how long continuous recognition can run
// before firing a terminal event — a stalled connection or a stuck service
// session leaves the SDK never calling `canceled`/`sessionStopped`, which
// would hang this promise (and the request) until the Function App's global
// 9-minute functionTimeout kills it with no useful error. Bound it ourselves
// to the audio's own duration plus a fixed grace period so a stuck session
// fails fast with a clear message instead.
const RECOGNITION_GRACE_MS = 30_000;
const MIN_RECOGNITION_TIMEOUT_MS = 30_000;

export function transcribePcm(pcmBuffer: Buffer, sampleRate: number): Promise<string> {
  const speechKey = requireEnv("AZURE_SPEECH_KEY");
  const region = requireEnv("AZURE_SPEECH_REGION");

  const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, region);
  // Auto-detect between English and Georgian rather than assuming en-US —
  // callers may record in either language and the SDK can't tell in advance.
  const autoDetectSourceLanguageConfig = sdk.AutoDetectSourceLanguageConfig.fromLanguages([
    "en-US",
    "ka-GE",
  ]);
  const format = sdk.AudioStreamFormat.getWaveFormatPCM(sampleRate, 16, 1);
  const pushStream = sdk.AudioInputStream.createPushStream(format);
  const arrayBuffer = pcmBuffer.buffer.slice(
    pcmBuffer.byteOffset,
    pcmBuffer.byteOffset + pcmBuffer.byteLength,
  ) as ArrayBuffer;
  pushStream.write(arrayBuffer);
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = sdk.SpeechRecognizer.FromConfig(
    speechConfig,
    autoDetectSourceLanguageConfig,
    audioConfig,
  );

  const audioSeconds = pcmBuffer.length / (sampleRate * 2);
  const timeoutMs = Math.max(MIN_RECOGNITION_TIMEOUT_MS, audioSeconds * 1000 + RECOGNITION_GRACE_MS);

  return new Promise((resolve, reject) => {
    const segments: string[] = [];
    let settled = false;

    function finish(fn: () => void) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      recognizer.close();
      fn();
    }

    const timeoutTimer = setTimeout(() => {
      recognizer.stopContinuousRecognitionAsync(
        () => finish(() => reject(new Error("Speech recognition timed out"))),
        () => finish(() => reject(new Error("Speech recognition timed out"))),
      );
    }, timeoutMs);

    recognizer.recognized = (_sender, event) => {
      if (event.result.reason === sdk.ResultReason.RecognizedSpeech && event.result.text) {
        segments.push(event.result.text);
      }
    };

    recognizer.canceled = (_sender, event) => {
      if (event.reason === sdk.CancellationReason.Error) {
        recognizer.stopContinuousRecognitionAsync(
          () => finish(() => reject(new Error(event.errorDetails))),
          () => finish(() => reject(new Error(event.errorDetails))),
        );
      }
    };

    recognizer.sessionStopped = () => {
      recognizer.stopContinuousRecognitionAsync(
        () => finish(() => resolve(segments.join(" ").trim())),
        (err) => finish(() => reject(new Error(err))),
      );
    };

    recognizer.startContinuousRecognitionAsync(undefined, (err) => finish(() => reject(new Error(err))));
  });
}
