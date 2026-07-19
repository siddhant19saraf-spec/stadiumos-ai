"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SustainabilityState } from "../types";

export function AnalyticsView({ state }: { state: SustainabilityState }) {
  return (
    <div className="space-y-3">
      <Card className="border-primary/10">
        <CardContent className="p-4">
          <h3 className="mb-3 text-xs font-medium text-card-foreground">ESG KPI Dashboard</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {state.esgKpis.map((kpi) => (
              <div key={kpi.metric} className={cn(
                "rounded-md border p-2",
                kpi.status === "achieved" ? "border-emerald-500/30 bg-emerald-500/5" :
                kpi.status === "on_track" ? "border-blue-500/30 bg-blue-500/5" :
                kpi.status === "at_risk" ? "border-amber-500/30 bg-amber-500/5" :
                "border-red-500/30 bg-red-500/5",
              )}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground capitalize">{kpi.category}</p>
                  <span className={cn(
                    "text-[8px] rounded-full px-1.5 py-0.5",
                    kpi.status === "achieved" ? "bg-emerald-500/20 text-emerald-400" :
                    kpi.status === "on_track" ? "bg-blue-500/20 text-blue-400" :
                    kpi.status === "at_risk" ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400",
                  )}>
                    {kpi.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-card-foreground">{kpi.metric}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold tabular-nums">{kpi.value}</span>
                  <span className="text-[10px] text-muted-foreground">/ {kpi.target} {kpi.unit}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className={cn(
                    "h-full rounded-full",
                    kpi.status === "achieved" ? "bg-emerald-500" :
                    kpi.status === "on_track" ? "bg-blue-500" :
                    kpi.status === "at_risk" ? "bg-amber-500" : "bg-red-500",
                  )} style={{ width: `${Math.min(100, (kpi.value / kpi.target) * 100)}%` }} />
                </div>
                <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">{kpi.trend} trend</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
