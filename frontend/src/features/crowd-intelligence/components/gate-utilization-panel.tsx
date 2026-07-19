"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { GateUtilization } from "../types";

interface GateUtilizationPanelProps {
  gates: GateUtilization[];
  className?: string;
}

function Trend({ trend }: { trend: string }) {
  if (trend === "increasing") return <TrendingUp className="h-3 w-3 text-red-400" />;
  if (trend === "decreasing") return <TrendingDown className="h-3 w-3 text-emerald-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

export function GateUtilizationPanel({ gates, className }: GateUtilizationPanelProps) {
  if (!gates || gates.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="text-sm">Gate Utilization</CardTitle></CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">No gate data available</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Gate Utilization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {gates.map((gate) => {
          const utilColor = gate.utilizationPercent > 80 ? "bg-red-500" : gate.utilizationPercent > 55 ? "bg-amber-500" : "bg-emerald-500";
          return (
            <div key={gate.gateName} className="rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground">{gate.gateName}</span>
                <Trend trend={gate.trend} />
              </div>
              <div className="mb-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{gate.currentRate} / min</span>
                <span>Cap: {gate.capacity}</span>
                <span>Wait: {gate.waitTime} min</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", utilColor)}
                  style={{ width: `${gate.utilizationPercent}%` }}
                />
              </div>
              <div className="mt-0.5 text-right text-[10px] text-muted-foreground">
                {gate.utilizationPercent.toFixed(0)}% utilized
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
