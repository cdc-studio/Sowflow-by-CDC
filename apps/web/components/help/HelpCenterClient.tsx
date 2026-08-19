"use client";

import { useMemo, useState } from "react";
import { PlayCircle, Search } from "lucide-react";
import type { Tutorial } from "@sowflow/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toEmbedUrl } from "@/lib/videoEmbed";

interface HelpCenterClientProps {
  tutorials: Tutorial[];
  initialQuery?: string;
}

function matchesQuery(tutorial: Tutorial, query: string): boolean {
  const haystack = [
    tutorial.title,
    tutorial.titleEn,
    tutorial.description,
    tutorial.descriptionEn,
    tutorial.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function HelpCenterClient({ tutorials, initialQuery }: HelpCenterClientProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [category, setCategory] = useState<string>("all");
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(tutorials.map((tutorial) => tutorial.category))),
    [tutorials],
  );

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    return tutorials.filter((tutorial) => {
      if (category !== "all" && tutorial.category !== category) return false;
      if (trimmed && !matchesQuery(tutorial, trimmed)) return false;
      return true;
    });
  }, [tutorials, query, category]);

  const grouped = useMemo(() => {
    const map = new Map<string, Tutorial[]>();
    for (const tutorial of filtered) {
      const list = map.get(tutorial.category) ?? [];
      list.push(tutorial);
      map.set(tutorial.category, list);
    }
    return map;
  }, [filtered]);

  const embedUrl = activeTutorial ? toEmbedUrl(activeTutorial.videoUrl) : null;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tutorials…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              category === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No tutorials match &ldquo;{query}&rdquo;.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-10">
        {Array.from(grouped.entries()).map(([cat, items]) => (
          <div key={cat}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{cat}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((tutorial) => (
                <button
                  key={tutorial.id}
                  type="button"
                  onClick={() => setActiveTutorial(tutorial)}
                  className="glass-panel group rounded-lg p-5 text-left transition-transform hover:-translate-y-0.5"
                >
                  <span className="glow-border flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                    <PlayCircle className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{tutorial.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{tutorial.description}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(activeTutorial)} onOpenChange={(open) => !open && setActiveTutorial(null)}>
        <DialogContent className="max-w-3xl p-6">
          {activeTutorial && (
            <>
              <DialogTitle>{activeTutorial.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">{activeTutorial.description}</p>
              <div className="mt-2 aspect-video w-full overflow-hidden rounded-md bg-black">
                {embedUrl ? (
                  <iframe
                    key={activeTutorial.id}
                    src={embedUrl}
                    title={activeTutorial.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <a
                    href={activeTutorial.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full w-full items-center justify-center text-sm text-white underline"
                  >
                    Open video
                  </a>
                )}
              </div>
              {(activeTutorial.titleEn || activeTutorial.descriptionEn) && (
                <div className="mt-2 flex items-start gap-2">
                  <Badge variant="secondary">EN</Badge>
                  <p className="text-xs text-muted-foreground">
                    {activeTutorial.titleEn}
                    {activeTutorial.titleEn && activeTutorial.descriptionEn ? " — " : ""}
                    {activeTutorial.descriptionEn}
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
