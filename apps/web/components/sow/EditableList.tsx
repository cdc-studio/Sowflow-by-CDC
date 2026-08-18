"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}

export function EditableList({ items, onChange, placeholder, addLabel = "Add item" }: EditableListProps) {
  function updateItem(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, ""]);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      )}
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(event) => updateItem(index, event.target.value)}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem} className="self-start">
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
