"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Package, AlertTriangle } from "lucide-react";
import type { ResourceAllocation } from "../types";

interface ResourceUtilizationProps {
  resources: ResourceAllocation[];
  className?: string;
}

export function ResourceUtilization({ resources, className }: ResourceUtilizationProps) {
  const sorted = [...resources].sort((a, b) => a.utilizationPercent - b.utilizationPercent);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4" />
          Resource Allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[450px] space-y-3 overflow-y-auto">
        {sorted.map((r) => {
          const barColor = r.status === "sufficient" ? "bg-emerald-500" : r.status === "shortage" ? "bg-red-500" : "bg-amber-500";
          return (
            <div key={r.type} className="rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium capitalize text-card-foreground">{r.type.replace(/_/g, " ")}</span>
                <span className={cn("text-xs font-semibold", r.status === "sufficient" ? "text-emerald-400" : "text-red-400")}>
                  {r.allocated}/{r.required}
                </span>
              </div>
              <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(100, (r.allocated / r.required) * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{r.utilizationPercent}% utilization</span>
                <span>{r.available} available</span>
              </div>
              {r.status === "shortage" && (
                <div className="mt-1 flex items-center gap-1 rounded bg-red-500/5 px-1.5 py-0.5 text-[9px] text-red-400">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Shortage: {r.required - r.allocated} additional required
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
