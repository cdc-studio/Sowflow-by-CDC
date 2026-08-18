"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SowExtraction } from "@sowflow/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RiskAlertBox } from "@/components/sow/RiskAlertBox";
import { EditableList } from "@/components/sow/EditableList";
import { DeliverablesEditor } from "@/components/sow/DeliverablesEditor";
import { PricingEditor } from "@/components/sow/PricingEditor";

type LoadState = "loading" | "not-found" | "error" | "ready";

export default function SowEditorPage({ params }: { params: { id: string } }) {
  const [sow, setSow] = useState<SowExtraction | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/projects/${params.id}`, { cache: "no-store" });
        if (cancelled) return;

        if (response.status === 404) {
          setLoadState("not-found");
          return;
        }
        if (!response.ok) {
          setLoadState("error");
          return;
        }

        const project = await response.json();
        setSow(project.extraction);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  function patch(fields: Partial<SowExtraction>) {
    setSow((current) => (current ? { ...current, ...fields } : current));
    setIsDirty(true);
  }

  async function handleSave() {
    if (!sow) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction: sow }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setSaveError(payload?.error ?? "Failed to save changes.");
        return;
      }
      setIsDirty(false);
    } catch {
      setSaveError("Failed to reach project storage.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Loading…</div>
    );
  }

  if (loadState === "not-found") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find this SOW — it may have been deleted, or belongs to a different
          account.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/new">Generate a new SOW</Link>
        </Button>
      </div>
    );
  }

  if (loadState === "error" || !sow) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-destructive">
          Something went wrong loading this SOW. Please refresh and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Input
            value={sow.projectTitle}
            onChange={(event) => patch({ projectTitle: event.target.value })}
            className="h-auto border-none px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Client:</span>
            <Input
              value={sow.clientName}
              onChange={(event) => patch({ clientName: event.target.value })}
              className="h-8 max-w-xs"
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? "Saving…" : isDirty ? "Save changes" : "Saved"}
          </Button>
          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </div>
      </div>

      <div className="mt-6">
        <RiskAlertBox riskFlags={sow.riskFlags} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sow.executiveSummary}
            onChange={(event) => patch({ executiveSummary: event.target.value })}
            rows={5}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Project Objectives</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableList
            items={sow.projectObjectives}
            onChange={(items) => patch({ projectObjectives: items })}
            placeholder="Objective"
            addLabel="Add objective"
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Deliverables & Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliverablesEditor
            deliverables={sow.deliverables}
            onChange={(deliverables) => patch({ deliverables })}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Out of Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableList
            items={sow.outOfScope}
            onChange={(items) => patch({ outOfScope: items })}
            placeholder="Excluded item"
            addLabel="Add exclusion"
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingEditor pricing={sow.pricing} onChange={(pricing) => patch({ pricing })} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Client Responsibilities</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableList
            items={sow.clientResponsibilities}
            onChange={(items) => patch({ clientResponsibilities: items })}
            placeholder="Responsibility"
            addLabel="Add responsibility"
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Asset Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableList
            items={sow.assetRequirements}
            onChange={(items) => patch({ assetRequirements: items })}
            placeholder="Asset"
            addLabel="Add asset"
          />
        </CardContent>
      </Card>
    </div>
  );
}
