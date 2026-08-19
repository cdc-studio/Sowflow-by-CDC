"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileText, ListChecks, UploadCloud, Wallet } from "lucide-react";
import type { SowExtraction } from "@sowflow/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingProgress } from "@/components/sow/LoadingProgress";
import { LiveRecorder } from "@/components/sow/LiveRecorder";
import { cn } from "@/lib/utils";

const MIN_TRANSCRIPT_LENGTH = 100;

type InputMode = "paste" | "upload" | "record";

const PREVIEW_FEATURES = [
  { icon: FileText, title: "Executive Summary & Objectives", desc: "A clean overview of the engagement." },
  { icon: ListChecks, title: "Deliverables & Milestones", desc: "Structured, dated, ready to track." },
  { icon: AlertTriangle, title: "Scope Creep Risk Detection", desc: "Vague promises flagged before they cost you." },
  { icon: Wallet, title: "Pricing & Payment Schedule", desc: "Fixed, hourly, or retainer — extracted automatically." },
];

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

  async function generateAndSave(rawTranscript: string) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/extract-sow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: rawTranscript }),
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = transcript.trim();
    if (trimmed.length < MIN_TRANSCRIPT_LENGTH) {
      setValidationError(
        `Paste at least ${MIN_TRANSCRIPT_LENGTH} characters of transcript so there's enough context to extract from.`,
      );
      return;
    }
    setValidationError(null);
    void generateAndSave(trimmed);
  }

  function handleTranscribed(recordedTranscript: string) {
    void generateAndSave(recordedTranscript);
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New SOW</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste, record, or upload a discovery-call transcript and SOWFlow will draft the Statement of
            Work.
          </p>
        </div>
        <Link
          href="/help?q=sow"
          className="shrink-0 whitespace-nowrap text-sm text-primary underline-offset-4 hover:underline"
        >
          Watch how it works
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
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
                onClick={() => setMode("record")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === "record"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                )}
              >
                Record live meeting
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
            ) : mode === "record" ? (
              <div className="flex flex-col gap-4">
                <LiveRecorder onTranscribed={handleTranscribed} disabled={isSubmitting} />
                {submitError && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {submitError}
                  </p>
                )}
              </div>
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
                    <Badge variant="secondary">Coming soon — file transcription pipeline</Badge>
                    <p className="max-w-sm text-xs text-muted-foreground">
                      Uploading a pre-recorded file runs through an async queue-based pipeline that
                      isn&apos;t wired up yet. Use &ldquo;Record live meeting&rdquo; or paste a
                      transcript for now.
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

        <div className="glass-panel hidden rounded-lg p-8 lg:flex lg:flex-col lg:justify-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Live preview</p>
          <h2 className="mt-2 text-lg font-semibold">Your Statement of Work will appear here</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            SOWFlow reads the transcript once and extracts a complete, editable draft:
          </p>
          <ul className="mt-6 flex flex-col gap-4">
            {PREVIEW_FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="glow-border flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <feature.icon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
