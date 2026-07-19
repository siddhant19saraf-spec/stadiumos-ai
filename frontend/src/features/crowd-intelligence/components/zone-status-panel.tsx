"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DENSITY_THRESHOLDS } from "../constants";
import type { StadiumZone } from "../types";

interface ZoneStatusPanelProps {
  zones: StadiumZone[];
  className?: string;
}

const statusBadge: Record<string, string> = {
  normal: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
  moderate: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
  congested: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20",
  critical: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
};

export function ZoneStatusPanel({ zones, className }: ZoneStatusPanelProps) {
  if (!zones || zones.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="text-sm">Zone Status</CardTitle></CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">No zone data available</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Zone Status</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] space-y-2 overflow-y-auto">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="flex items-center justify-between rounded-md border bg-gradient-to-r from-primary/5 to-transparent px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-card-foreground">{zone.name}</span>
                <span className="text-xs text-muted-foreground capitalize">({zone.type})</span>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{zone.currentCount.toLocaleString()} / {zone.capacity.toLocaleString()}</span>
                <span>Wait: ~{zone.waitTimeMinutes}min</span>
                <span>{zone.movementSpeed.toFixed(1)} m/s</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{ color: zone.densityPercent >= DENSITY_THRESHOLDS.critical.max ? DENSITY_THRESHOLDS.critical.color : zone.densityPercent >= DENSITY_THRESHOLDS.congested.max ? DENSITY_THRESHOLDS.congested.color : zone.densityPercent >= DENSITY_THRESHOLDS.moderate.max ? DENSITY_THRESHOLDS.moderate.color : DENSITY_THRESHOLDS.normal.color }}
              >
                {zone.densityPercent.toFixed(0)}%
              </span>
              <Badge variant="outline" className={cn("text-[10px]", statusBadge[zone.status])}>
                {zone.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
