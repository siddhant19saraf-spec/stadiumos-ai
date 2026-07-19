"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ZoneHealthMapProps {
  zones: { name: string; avgHealth: number; avgRisk: number; count: number }[];
  className?: string;
}

const healthColor = (score: number) =>
  score >= 70 ? "text-emerald-400" : score >= 45 ? "text-amber-400" : "text-red-400";
const healthBar = (score: number) =>
  score >= 70 ? "bg-emerald-500" : score >= 45 ? "bg-amber-500" : "bg-red-500";
const riskBar = (score: number) =>
  score >= 50 ? "bg-red-500" : score >= 25 ? "bg-orange-500" : "bg-amber-500";

export function ZoneHealthMap({ zones, className }: ZoneHealthMapProps) {
  if (zones.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
        No zone data available
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {zones.map((zone) => (
        <Card key={zone.name} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
          <CardContent className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-card-foreground capitalize">{zone.name}</span>
                <span className="text-[10px] text-muted-foreground">{zone.count} assets</span>
              </div>
              <span className={cn("text-lg font-bold tabular-nums", healthColor(zone.avgHealth))}>
                {zone.avgHealth}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Health</span>
                <span className={cn("font-medium tabular-nums", healthColor(zone.avgHealth))}>
                  {zone.avgHealth}%
                </span>
              </div>
              <Progress value={zone.avgHealth} className="h-1" indicatorclass={healthBar(zone.avgHealth)} />
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Risk</span>
                <span className={cn("font-medium tabular-nums", zone.avgRisk >= 50 ? "text-red-400" : "text-amber-400")}>
                  {zone.avgRisk}%
                </span>
              </div>
              <Progress value={zone.avgRisk} className="h-1" indicatorclass={riskBar(zone.avgRisk)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
