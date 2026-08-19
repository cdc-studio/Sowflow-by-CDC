"use client";

import { useState } from "react";
import Link from "next/link";
import { Mic, PenSquare, Play, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getYoutubeThumbnail, toEmbedUrl } from "@/lib/videoEmbed";

// Swap via NEXT_PUBLIC_DEMO_VIDEO_URL once the real walkthrough is ready —
// this default is an obviously-placeholder YouTube link.
const RAW_DEMO_VIDEO_URL =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "https://www.youtube.com/embed/dQw4w9WgXcQ";

const STEPS = [
  {
    icon: Mic,
    title: "1. Record or Upload",
    desc: "Capture meeting audio or paste a transcript, in Georgian or English.",
  },
  {
    icon: PenSquare,
    title: "2. AI Extraction",
    desc: "GPT-4o detects deliverables, pricing, and scope creep risks.",
  },
  {
    icon: Wallet,
    title: "3. Export Branded SOW",
    desc: "Download an agency-branded PDF contract, ready for signing.",
  },
];

export function VideoDemoSection() {
  const [playing, setPlaying] = useState(false);

  const embedUrl = toEmbedUrl(RAW_DEMO_VIDEO_URL) ?? RAW_DEMO_VIDEO_URL;
  const thumbnailUrl = getYoutubeThumbnail(embedUrl);

  return (
    <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">See SOWFlow in Action</h2>
        <p className="mt-2 text-lg text-muted-foreground">იხილეთ SOWFlow მოქმედებაში</p>
      </div>

      <div className="glow-border relative mx-auto mt-10 aspect-video w-full overflow-hidden rounded-xl bg-black">
        {playing ? (
          <iframe
            src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
            title="SOWFlow product demo"
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Play SOWFlow product demo"
            className="group relative h-full w-full"
          >
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt=""
                className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-secondary" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
              <span className="glow-border flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.title} className="glass-panel rounded-lg p-6 text-center sm:text-left">
            <span className="glow-border mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-secondary sm:mx-0">
              <step.icon className="h-5 w-5 text-primary" />
            </span>
            <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link href="/dashboard/new">Start Generating SOWs Now</Link>
        </Button>
      </div>
    </section>
  );
}
