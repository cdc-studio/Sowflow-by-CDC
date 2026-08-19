"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Branding, SowExtraction } from "@sowflow/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RiskAlertBox } from "@/components/sow/RiskAlertBox";
import { EditableList } from "@/components/sow/EditableList";
import { DeliverablesEditor } from "@/components/sow/DeliverablesEditor";
import { PricingEditor } from "@/components/sow/PricingEditor";
import { SowDocumentPreview } from "@/components/sow/SowDocumentPreview";
import { generateSowPdf } from "@/lib/generateSowPdf";

type LoadState = "loading" | "not-found" | "error" | "ready";

export default function SowEditorPage({ params }: { params: { id: string } }) {
  const [sow, setSow] = useState<SowExtraction | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

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

    async function loadBranding() {
      try {
        const [brandingRes, logoRes] = await Promise.all([
          fetch("/api/branding", { cache: "no-store" }),
          fetch("/api/branding/logo-data-url", { cache: "no-store" }),
        ]);
        if (cancelled) return;
        const brandingData = await brandingRes.json().catch(() => null);
        const logoData = await logoRes.json().catch(() => null);
        setBranding(brandingData ?? null);
        setLogoDataUrl(logoData?.dataUrl ?? null);
      } catch {
        // Branding is optional decoration — a failure here shouldn't block the editor.
      }
    }

    load();
    loadBranding();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  function handleDownloadPdf() {
    if (!sow) return;
    generateSowPdf(sow, branding ?? {}, logoDataUrl);
  }

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
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadPdf}>
                  Download PDF SOW
                </Button>
                <Button onClick={handleSave} disabled={!isDirty || isSaving}>
                  {isSaving ? "Saving…" : isDirty ? "Save changes" : "Saved"}
                </Button>
              </div>
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

        <div className="hidden lg:block">
          <div className="glass-panel sticky top-20 h-[calc(100vh-6rem)] overflow-hidden rounded-lg">
            <SowDocumentPreview sow={sow} branding={branding} logoDataUrl={logoDataUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
