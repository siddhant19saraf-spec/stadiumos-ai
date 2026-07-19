"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, Timer, Gauge, Car, Activity, Zap, Wheelchair, ParkingCircle } from "lucide-react";
import type { ParkingAnalytics } from "../types";

interface AnalyticsPanelProps {
  analytics: ParkingAnalytics;
  className?: string;
}

const scoreColor = (v: number) =>
  v >= 75 ? "text-emerald-400" : v >= 50 ? "text-amber-400" : "text-red-400";

export function AnalyticsPanel({ analytics, className }: AnalyticsPanelProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Predictive Analytics</span>
          <Badge variant="outline" className={cn("text-[10px]", scoreColor(analytics.aiOptimizationScore))}>
            Opt. Score: {analytics.aiOptimizationScore}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AnalyticCard icon={Activity} label="Avg Occupancy" value={`${analytics.avgOccupancyPercent}%`} desc="Across all lots" color={scoreColor(analytics.avgOccupancyPercent)} />
          <AnalyticCard icon={TrendingUp} label="Peak Utilization" value={`${analytics.peakUtilizationPercent}%`} desc={analytics.peakTime} color={scoreColor(analytics.peakUtilizationPercent)} />
          <AnalyticCard icon={Timer} label="Avg Parking Time" value={`${analytics.avgParkingDurationMin} min`} desc="Per vehicle" color="text-blue-400" />
          <AnalyticCard icon={Car} label="Vehicle Turnover" value={analytics.vehicleTurnoverAvg.toFixed(1)} desc="Per hour per slot" color="text-purple-400" />
          <AnalyticCard icon={Gauge} label="Traffic Delay" value={`${analytics.trafficDelayMin} min`} desc="Average wait" color={analytics.trafficDelayMin > 15 ? "text-red-400" : "text-amber-400"} />
          <AnalyticCard icon={ParkingCircle} label="Queue Health" value={`${analytics.queueHealthIndex}`} desc="Index (0-100)" color={scoreColor(analytics.queueHealthIndex)} />
          <AnalyticCard icon={Zap} label="EV Charger Usage" value={`${analytics.avgEvChargerUsage}%`} desc="Of capacity" color={analytics.avgEvChargerUsage > 75 ? "text-red-400" : "text-cyan-400"} />
          <AnalyticCard icon={Wheelchair} label="Accessible Util." value={`${analytics.accessibleUtilization}%`} desc="Of capacity" color={analytics.accessibleUtilization > 75 ? "text-amber-400" : "text-emerald-400"} />
        </div>

        <div className="rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <Gauge className="h-3.5 w-3.5 text-primary" />
              AI Optimization Score
            </span>
            <span className={cn("text-lg font-bold", scoreColor(analytics.aiOptimizationScore))}>
              {analytics.aiOptimizationScore}/100
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Total vehicles processed: <span className="font-semibold text-card-foreground">{analytics.totalVehiclesProcessed.toLocaleString()}</span>
          </p>
        </div>

        <div className="rounded-md bg-muted/20 p-2">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <span>Overflow utilization: {analytics.overflowUtilization}%</span>
            <span>Peak time: {analytics.peakTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticCard({ icon: Icon, label, value, desc, color }: { icon: React.ElementType; label: string; value: string; desc: string; color: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className={cn("text-sm font-semibold", color)}>{value}</p>
      <p className="text-[9px] text-muted-foreground">{desc}</p>
    </div>
  );
}
