"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import type { SowExtraction } from "@sowflow/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingProgress } from "@/components/sow/LoadingProgress";
import { cn } from "@/lib/utils";

const MIN_TRANSCRIPT_LENGTH = 100;

type InputMode = "paste" | "upload";

export default function NewProjectPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("paste");
  const [transcript, setTranscript] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFileName(event.target.files?.[0]?.name ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const trimmed = transcript.trim();
    if (trimmed.length < MIN_TRANSCRIPT_LENGTH) {
      setValidationError(
        `Paste at least ${MIN_TRANSCRIPT_LENGTH} characters of transcript so there's enough context to extract from.`,
      );
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/extract-sow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: trimmed }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setSubmitError(payload?.error ?? "Failed to generate the SOW. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const extraction = payload as SowExtraction;

      const saveResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction }),
      });
      const project = await saveResponse.json().catch(() => null);

      if (!saveResponse.ok || !project?.id) {
        setSubmitError(project?.error ?? "Generated the SOW but failed to save it. Please try again.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/dashboard/projects/${project.id}/editor`);
    } catch {
      setSubmitError("Failed to reach the extraction service. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">New SOW</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste a discovery-call transcript and SOWFlow will draft the Statement of Work.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("paste")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "paste"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
            >
              Paste transcript
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
            >
              Upload audio/video
            </button>
          </div>
          <CardTitle className="sr-only">Transcript input</CardTitle>
        </CardHeader>
        <CardContent>
          {isSubmitting ? (
            <LoadingProgress />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "paste" ? (
                <div className="flex flex-col gap-2">
                  <Textarea
                    value={transcript}
                    onChange={(event) => setTranscript(event.target.value)}
                    placeholder="Paste the Zoom / Teams / Meet transcript here…"
                    rows={14}
                    className="resize-y"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{transcript.trim().length} characters</span>
                    {validationError && (
                      <span className="text-destructive">{validationError}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-input px-6 py-10 text-center">
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Drop an .mp3, .m4a, or .mp4 file</p>
                    <p className="text-xs text-muted-foreground">
                      {fileName ?? "No file selected"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".mp3,.m4a,.mp4"
                    onChange={handleFileChange}
                    className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
                  />
                  <Badge variant="secondary">Coming in Phase 3 — transcription pipeline</Badge>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Audio/video transcription runs through an async queue-based pipeline that
                    isn&apos;t wired up yet. Paste a transcript for now.
                  </p>
                </div>
              )}

              {submitError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                disabled={mode !== "paste" || isSubmitting}
                className="self-start"
              >
                Generate SOW with AI
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
