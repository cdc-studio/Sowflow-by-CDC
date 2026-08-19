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

  return new Promise((resolve, reject) => {
    const segments: string[] = [];
    let settled = false;

    function finish(fn: () => void) {
      if (settled) return;
      settled = true;
      fn();
    }

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
