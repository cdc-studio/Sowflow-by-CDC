"use client";

import { Search } from "lucide-react";
import { useCommandPalette } from "@/components/CommandPaletteProvider";

export function SearchTriggerButton() {
  const { setOpen } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="hidden items-center gap-2 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:flex"
    >
      <Search className="h-3.5 w-3.5" />
      Search
      <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
    </button>
  );
}
