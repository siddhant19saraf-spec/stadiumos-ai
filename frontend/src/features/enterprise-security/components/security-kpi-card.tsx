"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IconType } from "@/types/common";

const colorMap: Record<string, string> = {
  healthy: "text-emerald-400 bg-emerald-500/10",
  warning: "text-amber-400 bg-amber-500/10",
  critical: "text-red-400 bg-red-500/10",
  neutral: "text-muted-foreground bg-primary/5",
};

export function SecurityKpiCard({ label, value, icon: Icon, status, subtitle }: { label: string; value: string; icon: IconType; status: "healthy" | "warning" | "critical" | "neutral"; subtitle?: string }) {
  return (
    <Card className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
      <CardContent className="flex items-start gap-2 p-2.5">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", colorMap[status] ?? colorMap.neutral)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] text-muted-foreground">{label}</p>
          <p className={cn("text-sm font-bold tabular-nums", status === "healthy" ? "text-emerald-400" : status === "warning" ? "text-amber-400" : status === "critical" ? "text-red-400" : "")}>{value}</p>
          {subtitle && <p className="text-[9px] text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
