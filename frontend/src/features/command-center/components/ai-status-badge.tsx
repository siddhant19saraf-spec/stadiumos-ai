"use client";

import { cn } from "@/lib/utils";
import type { AIProviderStatus } from "../types";

interface AIStatusBadgeProps {
  status: AIProviderStatus;
  healthScore: number;
  className?: string;
}

const statusConfig: Record<AIProviderStatus, { label: string; color: string; dot: string }> = {
  operational: {
    label: "AI Operational",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  degraded: {
    label: "AI Degraded",
    color: "text-amber-400",
    dot: "bg-amber-400",
  },
  down: {
    label: "AI Down",
    color: "text-red-400",
    dot: "bg-red-400",
  },
};

export function AIStatusBadge({ status, healthScore, className }: AIStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn("flex items-center gap-3 rounded-lg border bg-card px-3 py-2", className)}
      role="status"
      aria-label={`AI provider status: ${config.label}, health score: ${healthScore}%`}
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", config.dot)} aria-hidden="true" />
        <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              healthScore >= 95 ? "bg-emerald-400" : healthScore >= 85 ? "bg-amber-400" : "bg-red-400",
            )}
            style={{ width: `${healthScore}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{healthScore}%</span>
      </div>
    </div>
  );
}
