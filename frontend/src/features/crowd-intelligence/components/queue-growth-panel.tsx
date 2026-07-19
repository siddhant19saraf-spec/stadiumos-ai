"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Timer, TrendingUp, Users } from "lucide-react";
import type { QueueGrowthPoint } from "../types";

interface QueueGrowthPanelProps {
  queueGrowth: QueueGrowthPoint[];
  className?: string;
}

export function QueueGrowthPanel({ queueGrowth, className }: QueueGrowthPanelProps) {
  if (!queueGrowth || queueGrowth.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Timer className="h-4 w-4" /> Queue Growth</CardTitle></CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">No queue data available</CardContent>
      </Card>
    );
  }

  const grouped = queueGrowth.reduce<Record<string, QueueGrowthPoint[]>>((acc, q) => {
    if (!acc[q.location]) acc[q.location] = [];
    acc[q.location].push(q);
    return acc;
  }, {});

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Timer className="h-4 w-4" />
          Queue Growth Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(grouped).slice(0, 4).map(([location, points]) => {
          const latest = points[points.length - 1]!;
          const growthColor = latest.growthRate > 3 ? "text-red-400" : latest.growthRate > 0 ? "text-amber-400" : "text-emerald-400";
          return (
            <div key={location} className="rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3">
              <div className="mb-1 text-sm font-medium text-card-foreground">{location}</div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Current: {latest.currentLength}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Predicted 30m: {latest.predictedLength30m}
                </span>
                <span className={cn("flex items-center gap-1", growthColor)}>
                  Rate: {latest.growthRate > 0 ? "+" : ""}{latest.growthRate}/min
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (latest.currentLength / 60) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

