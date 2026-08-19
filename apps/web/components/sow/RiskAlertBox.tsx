"use client";

import { motion } from "framer-motion";
import type { RiskFlag } from "@sowflow/shared-types";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// text-*-300 pastel tones only read well on a dark surface — paired with a
// darker *-700 shade for light mode via the dark: variant so contrast holds
// in both themes instead of assuming the app is always dark.
const SEVERITY_CONFIG: Record<RiskFlag["severity"], { badge: string; glow: string; dot: string }> = {
  low: {
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    glow: "glow-ring-low",
    dot: "bg-blue-500 dark:bg-blue-400",
  },
  medium: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    glow: "glow-ring-medium",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  high: {
    badge: "bg-red-500/10 text-red-700 dark:text-red-300",
    glow: "glow-ring-high",
    dot: "bg-red-500 dark:bg-red-400",
  },
};

export function RiskAlertBox({ riskFlags }: { riskFlags: RiskFlag[] }) {
  if (riskFlags.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        No scope-creep risks detected in this transcript.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4" />
        Scope Creep / Risk Alerts ({riskFlags.length})
      </div>
      <ul className="flex flex-col gap-3">
        {riskFlags.map((flag, index) => {
          const config = SEVERITY_CONFIG[flag.severity];
          return (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
              className="rounded-md border border-border bg-card p-3"
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                  config.badge,
                  config.glow,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                {flag.severity}
              </span>
              <p className="mt-2 text-sm italic text-muted-foreground">&ldquo;{flag.quote}&rdquo;</p>
              <p className="mt-1 text-sm">{flag.risk}</p>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
