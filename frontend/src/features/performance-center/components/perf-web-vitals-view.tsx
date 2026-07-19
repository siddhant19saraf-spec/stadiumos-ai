"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PerformanceSummary } from "../types";

const vitalsConfig = [
  { label: "LCP (Largest Contentful Paint)", key: "lcpMs" as const, unit: "ms", target: 2500 },
  { label: "INP (Interaction to Next Paint)", key: "inpMs" as const, unit: "ms", target: 200 },
  { label: "CLS (Cumulative Layout Shift)", key: "cls" as const, unit: "", target: 0.1 },
  { label: "Avg Page Load", key: "avgPageLoadMs" as const, unit: "ms", target: 2000 },
  { label: "AI Response Time", key: "avgAiResponseMs" as const, unit: "ms", target: 2000 },
  { label: "Bundle Size", key: "bundleSizeKb" as const, unit: "KB", target: 500 },
];

function vitalStatus(value: number, target: number): "healthy" | "warning" | "critical" {
  if (value < target) return "healthy";
  if (value < target * 1.6) return "warning";
  return "critical";
}

export function WebVitalsView({ summary }: { summary: PerformanceSummary }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {vitalsConfig.map((v) => {
          const value = summary[v.key] as number;
          const status = vitalStatus(value, v.target);
          const pctOfTarget = Math.min(100, Math.round((value / v.target) * 100));
          return (
            <Card key={v.label} className="border-primary/10">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">{v.label}</p>
                  <Badge variant="outline" className={cn("text-[8px]", status === "healthy" ? "text-emerald-400" : status === "warning" ? "text-amber-400" : "text-red-400")}>{status}</Badge>
                </div>
                <p className={cn("mt-1 text-lg font-bold tabular-nums", status === "healthy" ? "text-emerald-400" : status === "warning" ? "text-amber-400" : "text-red-400")}>{value}{v.unit}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                  <div className={cn("h-full rounded-full transition-all", status === "healthy" ? "bg-emerald-500" : status === "warning" ? "bg-amber-500" : "bg-red-500")} style={{ width: `${pctOfTarget}%` }} />
                </div>
                <p className="mt-1 text-[9px] text-muted-foreground">Target: {v.target}{v.unit}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
