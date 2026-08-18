"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STATUS_MESSAGES = [
  "Reading the transcript…",
  "Filtering out small talk…",
  "Extracting deliverables and milestones…",
  "Checking for scope-creep risks…",
  "Structuring pricing and payment terms…",
  "Almost done…",
];

export function LoadingProgress() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => Math.min(current + 1, STATUS_MESSAGES.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{STATUS_MESSAGES[messageIndex]}</p>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </div>
  );
}
