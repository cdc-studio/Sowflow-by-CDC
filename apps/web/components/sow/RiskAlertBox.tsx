import type { RiskFlag } from "@sowflow/shared-types";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<RiskFlag["severity"], string> = {
  low: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300",
  medium: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300",
};

export function RiskAlertBox({ riskFlags }: { riskFlags: RiskFlag[] }) {
  if (riskFlags.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
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
        {riskFlags.map((flag, index) => (
          <li key={index} className="rounded-md border border-border bg-background p-3">
            <Badge className={cn("capitalize", SEVERITY_STYLES[flag.severity])}>
              {flag.severity}
            </Badge>
            <p className="mt-2 text-sm italic text-muted-foreground">&ldquo;{flag.quote}&rdquo;</p>
            <p className="mt-1 text-sm">{flag.risk}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
