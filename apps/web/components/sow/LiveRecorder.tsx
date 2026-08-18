"use client";

import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blobToWavBase64 } from "@/lib/audioToWav";
import { cn } from "@/lib/utils";

interface LiveRecorderProps {
  onTranscribed: (transcript: string) => void;
  disabled?: boolean;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function LiveRecorder({ onTranscribed, disabled }: LiveRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleStop() {
    setIsTranscribing(true);
    try {
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const dataBase64 = await blobToWavBase64(blob);

      const response = await fetch("/api/transcribe-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataBase64 }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Failed to transcribe the recording.");
        return;
      }
      if (!payload?.transcript) {
        setError("No speech was recognized in the recording.");
        return;
      }

      onTranscribed(payload.transcript);
    } catch {
      setError("Failed to transcribe the recording.");
    } finally {
      setIsTranscribing(false);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = handleStop;
      mediaRecorderRef.current = recorder;
      recorder.start();

      setIsRecording(true);
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    } catch {
      setError("Couldn't access the microphone. Check browser permissions and try again.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  }

  if (isTranscribing) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
        Transcribing your recording…
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-input px-6 py-10 text-center">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          isRecording ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground",
        )}
      >
        <Mic className="h-7 w-7" />
      </div>
      {isRecording && <p className="font-mono text-lg">{formatTime(elapsedSeconds)}</p>}
      <Button
        type="button"
        variant={isRecording ? "destructive" : "default"}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
      >
        {isRecording ? (
          <>
            <Square className="h-4 w-4" />
            Stop recording
          </>
        ) : (
          "Start recording"
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="max-w-sm text-xs text-muted-foreground">
        Records audio locally in your browser, transcribes it via Azure Speech, then generates the
        SOW automatically.
      </p>
    </div>
  );
}
