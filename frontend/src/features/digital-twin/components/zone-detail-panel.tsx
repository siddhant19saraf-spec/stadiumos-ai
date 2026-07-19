"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Users, Thermometer, Clock, Shield, AlertTriangle, Gauge, Lightbulb } from "lucide-react";
import type { StadiumZone, ZoneLiveStatus, ZoneRecommendation } from "../types";

interface ZoneDetailPanelProps {
  zone: StadiumZone | null;
  status: ZoneLiveStatus | null;
  recommendation: ZoneRecommendation | null;
  className?: string;
}

export function ZoneDetailPanel({ zone, status, recommendation, className }: ZoneDetailPanelProps) {
  if (!zone || !status) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="text-sm">Zone Detail</CardTitle></CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          Click a zone on the map
        </CardContent>
      </Card>
    );
  }

  const pctColor = status.occupancyPercent >= 85 ? "text-red-400" : status.occupancyPercent >= 70 ? "text-orange-400" : status.occupancyPercent >= 55 ? "text-amber-400" : "text-emerald-400";

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{zone.name}</span>
          <Badge variant="outline" className={cn("text-[10px]", status.status === "emergency" ? "bg-red-500/10 text-red-400" : status.status === "degraded" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400")}>
            {status.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Metric icon={Users} label="Occupancy" value={`${status.currentOccupancy.toLocaleString()} / ${status.maxCapacity.toLocaleString()}`} color={pctColor} />
          <Metric icon={Thermometer} label="Temperature" value={`${status.temperature.toFixed(1)}°C`} color="text-blue-400" />
          <Metric icon={Clock} label="Queue Time" value={`~${status.queueTimeMinutes} min`} color={status.queueTimeMinutes > 10 ? "text-red-400" : "text-muted-foreground"} />
          <Metric icon={Shield} label="Safety Score" value={`${status.safetyScore.toFixed(0)}`} color={status.safetyScore > 80 ? "text-emerald-400" : "text-amber-400"} />
          <Metric icon={AlertTriangle} label="Risk Score" value={`${status.riskScore.toFixed(0)}`} color={status.riskScore > 60 ? "text-red-400" : "text-muted-foreground"} />
          <Metric icon={Gauge} label="Predicted 30m" value={`${status.predictedOccupancy30m}%`} color={status.predictedOccupancy30m > 75 ? "text-red-400" : "text-muted-foreground"} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <InfoBadge label="Zone Type" value={zone.type.replace(/_/g, " ")} />
          <InfoBadge label="Level" value={`Level ${zone.level}`} />
          {zone.section && <InfoBadge label="Section" value={zone.section} />}
          <InfoBadge label="Maintenance" value={status.maintenanceStatus.replace(/_/g, " ")} color={status.maintenanceStatus === "overdue" ? "text-red-400" : ""} />
          <InfoBadge label="Cleaning" value={status.cleaningStatus.replace(/_/g, " ")} color={status.cleaningStatus === "due" ? "text-amber-400" : ""} />
        </div>

        {recommendation && (
          <div className="rounded-md border bg-gradient-to-r from-amber-500/5 to-transparent p-3">
            <div className="mb-1 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-card-foreground">AI Analysis</span>
              <Badge variant="outline" className={cn("text-[9px]", recommendation.riskLevel === "critical" ? "bg-red-500/10 text-red-400" : recommendation.riskLevel === "high" ? "bg-orange-500/10 text-orange-400" : "bg-amber-500/10 text-amber-400")}>
                {recommendation.riskLevel}
              </Badge>
            </div>
            <p className="mb-1.5 text-xs text-muted-foreground">
              Occupancy predicted to reach <span className="font-semibold text-card-foreground">{recommendation.predictedOccupancyPercent}%</span> within {recommendation.timeToPrediction}.
            </p>
            <p className="mb-1 text-[10px] font-medium text-card-foreground">Recommended actions:</p>
            <ul className="space-y-0.5">
              {recommendation.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Confidence: {recommendation.confidence}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-md bg-muted/30 p-2">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className={cn("mt-0.5 text-xs font-semibold", color)}>{value}</p>
    </div>
  );
}

function InfoBadge({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span className={cn("rounded bg-muted/50 px-1.5 py-0.5 text-[9px] text-muted-foreground", color)}>
      {label}: {value}
    </span>
  );
}
