"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Deliverable } from "@sowflow/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DeliverablesEditorProps {
  deliverables: Deliverable[];
  onChange: (deliverables: Deliverable[]) => void;
}

export function DeliverablesEditor({ deliverables, onChange }: DeliverablesEditorProps) {
  function update(index: number, patch: Partial<Deliverable>) {
    const next = [...deliverables];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function remove(index: number) {
    onChange(deliverables.filter((_, i) => i !== index));
  }

  function add() {
    onChange([
      ...deliverables,
      { id: crypto.randomUUID(), title: "", description: "", milestone: "", dueDate: "" },
    ]);
  }

  return (
    <div className="flex flex-col gap-3">
      {deliverables.length === 0 && (
        <p className="text-sm text-muted-foreground">No deliverables yet.</p>
      )}
      {deliverables.map((deliverable, index) => (
        <div key={deliverable.id} className="rounded-md border border-border p-3">
          <div className="flex items-start gap-2">
            <Input
              value={deliverable.title}
              onChange={(event) => update(index, { title: event.target.value })}
              placeholder="Deliverable title"
              className="font-medium"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={deliverable.description}
            onChange={(event) => update(index, { description: event.target.value })}
            placeholder="Description"
            rows={2}
            className="mt-2"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input
              value={deliverable.milestone ?? ""}
              onChange={(event) => update(index, { milestone: event.target.value })}
              placeholder="Milestone"
            />
            <Input
              value={deliverable.dueDate ?? ""}
              onChange={(event) => update(index, { dueDate: event.target.value })}
              placeholder="Due date"
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="self-start">
        <Plus className="h-4 w-4" />
        Add deliverable
      </Button>
    </div>
  );
}
