"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Thermometer, Zap, Activity, Gauge, Vibrate, Waves } from "lucide-react";
import type { AssetHealth } from "../types";

interface AssetDetailCardProps {
  health: AssetHealth;
  className?: string;
}

const statusColor: Record<string, string> = {
  healthy: "bg-emerald-500/10 text-emerald-400",
  warning: "bg-amber-500/10 text-amber-400",
  critical: "bg-red-500/10 text-red-400",
  offline: "bg-slate-500/10 text-slate-400",
};

const healthBarColor = (score: number) =>
  score >= 70 ? "bg-emerald-500" : score >= 45 ? "bg-amber-500" : "bg-red-500";

export function AssetDetailCard({ health, className }: AssetDetailCardProps) {
  return (
    <Card className={cn("border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-card-foreground">{health.assetName}</h3>
            <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">{health.type.replace(/_/g, " ")}</p>
          </div>
          <Badge variant="outline" className={cn("text-[10px]", statusColor[health.status])}>
            {health.status}
          </Badge>
        </div>

        <div className="mt-3 space-y-2">
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Health Score</span>
              <span className={cn("font-medium tabular-nums", healthBarColor(health.healthScore).replace("bg-", "text-"))}>
                {health.healthScore}%
              </span>
            </div>
            <Progress value={health.healthScore} className="h-1.5" indicatorclass={healthBarColor(health.healthScore)} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Risk Score</span>
              <span className={cn("font-medium tabular-nums", health.riskScore >= 50 ? "text-red-400" : "text-amber-400")}>
                {health.riskScore}%
              </span>
            </div>
            <Progress value={health.riskScore} className="h-1.5" indicatorclass={health.riskScore >= 50 ? "bg-red-500" : "bg-amber-500"} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 rounded-md bg-primary/5 p-2">
            <Thermometer className="h-3 w-3 text-red-400" />
            <div>
              <p className="text-muted-foreground">Temperature</p>
              <p className="font-medium tabular-nums">{health.temperature}°C</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-primary/5 p-2">
            <Zap className="h-3 w-3 text-amber-400" />
            <div>
              <p className="text-muted-foreground">Power</p>
              <p className="font-medium tabular-nums">{health.powerUsageKw}kW</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-primary/5 p-2">
            <Activity className="h-3 w-3 text-blue-400" />
            <div>
              <p className="text-muted-foreground">Utilization</p>
              <p className="font-medium tabular-nums">{health.utilization}%</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-primary/5 p-2">
            <Vibrate className="h-3 w-3 text-purple-400" />
            <div>
              <p className="text-muted-foreground">Vibration</p>
              <p className="font-medium tabular-nums">{health.vibrationMmS}mm/s</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-primary/5 p-2">
            <Gauge className="h-3 w-3 text-orange-400" />
            <div>
              <p className="text-muted-foreground">Pressure</p>
              <p className="font-medium tabular-nums">{health.pressureBar}bar</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-primary/5 p-2">
            <Waves className="h-3 w-3 text-cyan-400" />
            <div>
              <p className="text-muted-foreground">Maintenance</p>
              <p className="font-medium capitalize">{health.maintenanceStatus.replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>

        {health.predictedFailureDate && (
          <div className="mt-3 rounded-md bg-red-500/5 p-2 text-[10px] text-red-400">
            <p>Predicted failure: {new Date(health.predictedFailureDate).toLocaleDateString()}</p>
          </div>
        )}
        {health.remainingUsefulLife && (
          <div className="mt-1.5 text-[10px] text-muted-foreground">
            Remaining useful life: {health.remainingUsefulLife}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
