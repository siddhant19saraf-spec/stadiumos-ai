"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Calendar, Brain, DollarSign, TrendingUp } from "lucide-react";
import type { FailurePrediction } from "../types";

interface PredictionPanelProps {
  predictions: FailurePrediction[];
  className?: string;
}

const probabilityColor = (pct: number) =>
  pct >= 75 ? "text-red-400" : pct >= 50 ? "text-orange-400" : pct >= 25 ? "text-amber-400" : "text-emerald-400";

const modeLabels: Record<string, string> = {
  mechanical_wear: "Mechanical Wear",
  electrical_fault: "Electrical Fault",
  component_failure: "Component Failure",
  battery_degradation: "Battery Degradation",
  sensor_drift: "Sensor Drift",
  cooling_failure: "Cooling Failure",
  power_instability: "Power Instability",
  network_failure: "Network Failure",
  performance_degradation: "Performance Degradation",
  overheating: "Overheating",
  firmware_corruption: "Firmware Corruption",
  physical_damage: "Physical Damage",
};

export function PredictionPanel({ predictions, className }: PredictionPanelProps) {
  if (predictions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
        No failure predictions at this time
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {predictions.map((p) => (
        <Card key={`${p.assetId}-${p.failureMode}`} className="border-primary/10 bg-gradient-to-br from-background to-red-500/[0.02]">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-card-foreground">{p.assetName}</span>
                  <Badge variant="outline" className="text-[10px] text-amber-400">
                    {modeLabels[p.failureMode] ?? p.failureMode.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Brain className="h-3 w-3" />
                  Confidence: {p.confidence}% &middot;
                  <Calendar className="h-3 w-3" />
                  {p.predictedDays} days
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={cn("text-lg font-bold tabular-nums", probabilityColor(p.probability))}>
                  {p.probability}%
                </span>
                <span className="text-[10px] text-muted-foreground">probability</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 rounded bg-red-500/5 px-2 py-1.5 text-[10px] text-red-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{p.recommendedAction}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              {p.estimatedCostImpact && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {p.estimatedCostImpact}
                </span>
              )}
              {p.operationalImpact && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {p.operationalImpact.length > 60 ? `${p.operationalImpact.slice(0, 60)}...` : p.operationalImpact}
                </span>
              )}
            </div>

            {p.contributingFactors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                  Contributing factors ({p.contributingFactors.length})
                </summary>
                <ul className="mt-1 space-y-0.5 pl-3 text-[10px] text-muted-foreground">
                  {p.contributingFactors.map((f, i) => (
                    <li key={i} className="list-disc">{f}</li>
                  ))}
                </ul>
              </details>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
