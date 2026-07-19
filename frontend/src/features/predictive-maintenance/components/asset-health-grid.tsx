"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Thermometer, Zap, Activity, Gauge, Vibrate, Waves } from "lucide-react";
import type { AssetHealth } from "../types";

interface AssetHealthGridProps {
  assets: AssetHealth[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

const statusColor: Record<string, string> = {
  healthy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  offline: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const healthBarColor = (score: number) =>
  score >= 70 ? "bg-emerald-500" : score >= 45 ? "bg-amber-500" : "bg-red-500";

const riskBarColor = (score: number) =>
  score >= 75 ? "bg-red-500" : score >= 50 ? "bg-orange-500" : score >= 25 ? "bg-amber-500" : "bg-emerald-500";

export function AssetHealthGrid({ assets, selectedId, onSelect, className }: AssetHealthGridProps) {
  if (assets.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
        No asset health data available
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {assets.map((asset) => (
        <Card
          key={asset.assetId}
          className={cn(
            "cursor-pointer border-primary/10 bg-gradient-to-br from-background to-primary/[0.02] transition-all duration-200 hover:bg-muted/20",
            selectedId === asset.assetId && "ring-1 ring-primary",
          )}
          onClick={() => onSelect?.(asset.assetId)}
          role="button"
          tabIndex={0}
          aria-selected={selectedId === asset.assetId}
          onKeyDown={(e) => e.key === "Enter" && onSelect?.(asset.assetId)}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-card-foreground">{asset.assetName}</span>
                  <Badge variant="outline" className={cn("text-[10px]", statusColor[asset.status])}>
                    {asset.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">{asset.type.replace(/_/g, " ")}</p>
              </div>
            </div>

            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Health</span>
                <span className={cn("font-medium tabular-nums", healthBarColor(asset.healthScore).replace("bg-", "text-"))}>
                  {asset.healthScore}%
                </span>
              </div>
              <Progress value={asset.healthScore} className="h-1" indicatorclass={healthBarColor(asset.healthScore)} />
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Risk</span>
                <span className={cn("font-medium tabular-nums", riskBarColor(asset.riskScore).replace("bg-", "text-"))}>
                  {asset.riskScore}%
                </span>
              </div>
              <Progress value={asset.riskScore} className="h-1" indicatorclass={riskBarColor(asset.riskScore)} />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Thermometer className="h-3 w-3" />
                {asset.temperature}°C
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {asset.powerUsageKw}kW
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {asset.utilization}%
              </span>
              <span className="flex items-center gap-1">
                <Vibrate className="h-3 w-3" />
                {asset.vibrationMmS}mm/s
              </span>
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                {asset.pressureBar}bar
              </span>
              <span className="flex items-center gap-1">
                <Waves className="h-3 w-3" />
                {asset.maintenanceStatus.replace(/_/g, " ")}
              </span>
            </div>

            {asset.predictedFailureDate && (
              <div className="mt-2 rounded bg-red-500/5 px-2 py-1 text-[10px] text-red-400">
                Predicted failure: {new Date(asset.predictedFailureDate).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
