"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, Users, AlertTriangle, Zap } from "lucide-react";
import type { LiveAnalytics, ZoneLiveStatus } from "../types";

interface AnalyticsPanelProps {
  analytics: LiveAnalytics;
  zoneStatuses: Map<string, ZoneLiveStatus>;
  className?: string;
}

export function AnalyticsPanel({ analytics, zoneStatuses, className }: AnalyticsPanelProps) {
  const topZones = useMemo(() => {
    const entries = Array.from(zoneStatuses.values())
      .filter((s) => s.status === "degraded" || s.status === "emergency")
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
    return entries;
  }, [zoneStatuses]);

  const occPct = analytics.totalCapacity > 0 ? (analytics.totalOccupancy / analytics.totalCapacity) * 100 : 0;
  const totalZones = zoneStatuses.size;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Stadium Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AnalyticCard
            icon={Users}
            label="Total Occupancy"
            value={analytics.totalOccupancy.toLocaleString()}
            subtitle={`${occPct.toFixed(1)}% capacity`}
            color={occPct > 80 ? "text-red-400" : occPct > 65 ? "text-amber-400" : "text-emerald-400"}
          />
          <AnalyticCard
            icon={Activity}
            label="Health Score"
            value={analytics.operationalHealth.toFixed(1)}
            subtitle={`${zonesWith(zoneStatuses, "operational")} zones nominal`}
            color={analytics.operationalHealth > 80 ? "text-emerald-400" : analytics.operationalHealth > 60 ? "text-amber-400" : "text-red-400"}
          />
          <AnalyticCard
            icon={AlertTriangle}
            label="Safety Index"
            value={analytics.safetyIndex.toFixed(1)}
            subtitle={`${analytics.activeIncidents} active alerts`}
            color={analytics.safetyIndex < 60 ? "text-red-400" : analytics.safetyIndex < 75 ? "text-amber-400" : "text-muted-foreground"}
          />
          <AnalyticCard
            icon={Zap}
            label="Energy Usage"
            value={`${analytics.energyUsageMw.toFixed(1)} MW`}
            subtitle={`${analytics.maintenanceHealth.toFixed(0)}% maintenance health`}
            color={analytics.energyUsageMw > 30 ? "text-red-400" : "text-blue-400"}
          />
        </div>

        {topZones.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-medium text-muted-foreground">Zones requiring attention</p>
            <div className="space-y-1">
              {topZones.map((z) => (
                <div key={z.zoneId} className="flex items-center justify-between rounded-md bg-muted/20 px-2.5 py-1.5">
                  <span className="text-xs">{(z.zoneId ?? "Unknown").replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px]",
                      z.occupancyPercent > 80 ? "text-red-400" : "text-amber-400",
                    )}>
                      {z.occupancyPercent.toFixed(0)}% occ.
                    </span>
                    <span className="text-[10px] text-muted-foreground">Risk {z.riskScore.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticCard({ icon: Icon, label, value, subtitle, color }: { icon: React.ElementType; label: string; value: string; subtitle: string; color: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className={cn("text-sm font-semibold", color)}>{value}</p>
      <p className="text-[9px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function zonesWith(statuses: Map<string, ZoneLiveStatus>, status: string): number {
  let c = 0;
  for (const s of statuses.values()) {
    if (s.status === status) c++;
  }
  return c;
}
