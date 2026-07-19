"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, CheckCircle, Shield, Activity, Gauge } from "lucide-react";
import type { EmergencyAnalytics } from "../types";

interface EmergencyStatsCardsProps {
  analytics: EmergencyAnalytics;
  className?: string;
}

const statCards = [
  {
    key: "avg_response",
    label: "Avg Response Time",
    icon: Clock,
    getValue: (a: EmergencyAnalytics) => `${a.averageResponseMinutes.toFixed(1)}m`,
    getSub: (a: EmergencyAnalytics) => `${a.totalIncidents} total incidents`,
    color: (a: EmergencyAnalytics) => a.averageResponseMinutes < 4 ? "text-emerald-400" : a.averageResponseMinutes < 7 ? "text-amber-400" : "text-red-400",
  },
  {
    key: "critical",
    label: "Critical Incidents",
    icon: AlertTriangle,
    getValue: (a: EmergencyAnalytics) => `${a.criticalIncidents}`,
    getSub: (a: EmergencyAnalytics) => `${a.openIncidents} open total`,
    color: (a: EmergencyAnalytics) => a.criticalIncidents > 2 ? "text-red-400" : a.criticalIncidents > 0 ? "text-amber-400" : "text-emerald-400",
  },
  {
    key: "resolved",
    label: "Resolved",
    icon: CheckCircle,
    getValue: (a: EmergencyAnalytics) => `${a.resolvedIncidents}`,
    getSub: (a: EmergencyAnalytics) => `${((a.resolvedIncidents / Math.max(1, a.totalIncidents)) * 100).toFixed(0)}% closure rate`,
    color: () => "text-emerald-400",
  },
  {
    key: "readiness",
    label: "Emergency Readiness",
    icon: Shield,
    getValue: (a: EmergencyAnalytics) => `${a.emergencyReadinessScore}`,
    getSub: (a: EmergencyAnalytics) => `${a.availableTeams} teams available`,
    color: (a: EmergencyAnalytics) => a.emergencyReadinessScore > 80 ? "text-emerald-400" : a.emergencyReadinessScore > 60 ? "text-amber-400" : "text-red-400",
  },
  {
    key: "safety",
    label: "Safety Score",
    icon: Gauge,
    getValue: (a: EmergencyAnalytics) => `${a.safetyScore}`,
    getSub: (a: EmergencyAnalytics) => a.safetyScore > 80 ? "Excellent" : a.safetyScore > 60 ? "Moderate" : "At Risk",
    color: (a: EmergencyAnalytics) => a.safetyScore > 80 ? "text-emerald-400" : a.safetyScore > 60 ? "text-amber-400" : "text-red-400",
  },
  {
    key: "teams",
    label: "Active Teams",
    icon: Activity,
    getValue: (a: EmergencyAnalytics) => `${a.activeTeams}`,
    getSub: (a: EmergencyAnalytics) => `${a.resourceUtilization}% utilization`,
    color: (a: EmergencyAnalytics) => a.resourceUtilization > 80 ? "text-red-400" : a.resourceUtilization > 55 ? "text-amber-400" : "text-emerald-400",
  },
];

export function EmergencyStatsCards({ analytics, className }: EmergencyStatsCardsProps) {
  if (!analytics || analytics.totalIncidents === undefined) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6", className)}>
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="p-3 text-center text-sm text-muted-foreground">Loading...</CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6", className)}>
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.label}</span>
                <Icon className={cn("h-3.5 w-3.5", card.color(analytics))} />
              </div>
              <div className={cn("mt-1 text-lg font-bold", card.color(analytics))}>
                {card.getValue(analytics)}
              </div>
              <p className="text-[10px] text-muted-foreground">{card.getSub(analytics)}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
