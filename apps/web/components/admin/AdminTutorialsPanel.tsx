"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Tutorial, UpsertTutorialRequest } from "@sowflow/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const EMPTY_FORM: UpsertTutorialRequest = {
  title: "",
  titleEn: "",
  description: "",
  descriptionEn: "",
  videoUrl: "",
  category: "",
  order: 0,
  published: false,
};

export function AdminTutorialsPanel() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UpsertTutorialRequest>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/tutorials", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? "Failed to load tutorials.");
        return;
      }
      setTutorials(payload ?? []);
    } catch {
      setError("Failed to reach tutorial storage.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(tutorial: Tutorial) {
    setEditingId(tutorial.id);
    setForm({
      title: tutorial.title,
      titleEn: tutorial.titleEn ?? "",
      description: tutorial.description,
      descriptionEn: tutorial.descriptionEn ?? "",
      videoUrl: tutorial.videoUrl,
      category: tutorial.category,
      order: tutorial.order,
      published: Boolean(tutorial.publishedAt),
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleDelete(tutorial: Tutorial) {
    if (!confirm(`Delete "${tutorial.title}"? This can't be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/tutorials/${tutorial.id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Failed to delete tutorial.");
        return;
      }
      setTutorials((prev) => prev.filter((item) => item.id !== tutorial.id));
    } catch {
      setError("Failed to reach tutorial storage.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const body: UpsertTutorialRequest = {
      ...form,
      titleEn: form.titleEn?.trim() || undefined,
      descriptionEn: form.descriptionEn?.trim() || undefined,
      order: Number(form.order) || 0,
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/tutorials/${editingId}` : "/api/admin/tutorials",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError(payload?.error ?? "Failed to save tutorial.");
        return;
      }
      setDialogOpen(false);
      await load();
    } catch {
      setFormError("Failed to reach tutorial storage.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Video Tutorials</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add tutorial
        </Button>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && tutorials.length === 0 && (
          <p className="text-sm text-muted-foreground">No tutorials yet. Add one to populate the Help Center.</p>
        )}

        {!loading && tutorials.length > 0 && (
          <div className="flex flex-col divide-y divide-border">
            {tutorials.map((tutorial) => (
              <div key={tutorial.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{tutorial.title}</p>
                    <Badge variant={tutorial.publishedAt ? "default" : "secondary"}>
                      {tutorial.publishedAt ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {tutorial.category} · order {tutorial.order}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(tutorial)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(tutorial)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto p-6">
          <DialogTitle>{editingId ? "Edit tutorial" : "Add tutorial"}</DialogTitle>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Title</Label>
                <Input
                  required
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Title (English)</Label>
                <Input
                  value={form.titleEn}
                  onChange={(event) => setForm({ ...form, titleEn: event.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <Textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Description (English)</Label>
                <Textarea
                  rows={3}
                  value={form.descriptionEn}
                  onChange={(event) => setForm({ ...form, descriptionEn: event.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Video URL (YouTube, Loom, or Vimeo)</Label>
              <Input
                required
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.videoUrl}
                onChange={(event) => setForm({ ...form, videoUrl: event.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label>Category</Label>
                <Input
                  required
                  placeholder="Getting Started"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) => setForm({ ...form, published: event.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              Published (visible on the public Help Center)
            </label>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <Button type="submit" disabled={saving} className="self-start">
              {saving ? "Saving…" : editingId ? "Save changes" : "Add tutorial"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
