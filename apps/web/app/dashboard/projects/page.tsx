"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Project } from "@sowflow/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type LoadState = "loading" | "error" | "ready";

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/projects", { cache: "no-store" });
        if (cancelled) return;
        if (!response.ok) {
          setLoadState("error");
          return;
        }
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My SOWs</h1>
        <Button asChild>
          <Link href="/dashboard/new">New SOW</Link>
        </Button>
      </div>

      {loadState === "loading" && (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      )}

      {loadState === "error" && (
        <p className="mt-6 text-sm text-destructive">
          Failed to load your SOWs. Please refresh and try again.
        </p>
      )}

      {loadState === "ready" && projects.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          You haven&apos;t generated any SOWs yet.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/dashboard/projects/${project.id}/editor`}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{project.extraction.projectTitle}</p>
                  <p className="text-sm text-muted-foreground">{project.extraction.clientName}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
