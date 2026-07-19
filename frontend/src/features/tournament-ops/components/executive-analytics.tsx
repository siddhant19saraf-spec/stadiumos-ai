"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, DollarSign, Users, Clock, Shield } from "lucide-react";
import type { TournamentAnalytics, DailyStat } from "../types";

interface ExecutiveAnalyticsProps {
  analytics: TournamentAnalytics;
  dailyStats: DailyStat[];
  className?: string;
}

export function ExecutiveAnalytics({ analytics, dailyStats, className }: ExecutiveAnalyticsProps) {
  if (!analytics || analytics.totalMatches === undefined) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Executive Analytics</CardTitle></CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">Loading analytics...</CardContent>
      </Card>
    );
  }

  const statRows = [
    { label: "Total Revenue", value: `$${(analytics.totalRevenue / 1000000).toFixed(1)}M`, icon: DollarSign, color: "text-emerald-400" },
    { label: "Total Attendance", value: `${(analytics.totalAttendance / 1000000).toFixed(1)}M`, icon: Users, color: "text-blue-400" },
    { label: "Avg Attendance", value: analytics.averageAttendance.toLocaleString(), icon: TrendingUp, color: "text-purple-400" },
    { label: "Avg Delay", value: `${analytics.averageDelayMinutes} min`, icon: Clock, color: analytics.averageDelayMinutes > 10 ? "text-red-400" : "text-amber-400" },
    { label: "Safety Index", value: `${analytics.safetyIndex}`, icon: Shield, color: analytics.safetyIndex > 85 ? "text-emerald-400" : "text-amber-400" },
    { label: "Venue Utilization", value: `${analytics.venueUtilization}%`, icon: BarChart3, color: "text-cyan-400" },
  ];

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4" />
          Executive Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  {row.label}
                </div>
                <p className={cn("mt-0.5 text-xs font-semibold", row.color)}>{row.value}</p>
              </div>
            );
          })}
        </div>

        <div>
          <h4 className="mb-2 text-xs font-medium text-card-foreground">Daily Attendance Trend</h4>
          <div className="flex items-end gap-1" style={{ height: 60 }}>
            {dailyStats.map((d, i) => {
              const max = Math.max(...dailyStats.map((ds) => ds.totalAttendance), 1);
              const h = (d.totalAttendance / max) * 55;
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t bg-primary transition-all"
                    style={{ height: `${Math.max(4, h)}px` }}
                    title={`${d.date}: ${d.totalAttendance.toLocaleString()}`}
                  />
                  <span className="text-[7px] text-muted-foreground">{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[10px]">
          <div className="rounded-md bg-muted/30 p-2">
            <span className="text-muted-foreground">Per-Venue Stats</span>
            {analytics.perVenueStats.slice(0, 4).map((vs) => (
              <div key={vs.venueId} className="mt-1 flex justify-between">
                <span className="text-card-foreground">{vs.venueName}</span>
                <span className={cn(vs.readinessPercent >= 85 ? "text-emerald-400" : "text-amber-400")}>
                  {vs.utilizationPercent}% · {vs.readinessPercent}%
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-md bg-muted/30 p-2">
            <span className="text-muted-foreground">KPIs</span>
            <div className="mt-1 space-y-1">
              <div className="flex justify-between"><span>Operational Efficiency</span><span className="text-card-foreground">{analytics.operationalEfficiency}%</span></div>
              <div className="flex justify-between"><span>Resource Utilization</span><span className="text-card-foreground">{analytics.resourceUtilization}%</span></div>
              <div className="flex justify-between"><span>Conflict Resolution</span><span className="text-card-foreground">{analytics.conflictResolutionRate}%</span></div>
              <div className="flex justify-between"><span>Readiness Score</span><span className="text-card-foreground">{analytics.readinessScore}</span></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
