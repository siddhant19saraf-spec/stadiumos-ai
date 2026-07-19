"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, Brain, ArrowRight, Users, Route, Timer } from "lucide-react";
import type { CrowdPrediction } from "../types";

interface PredictionPanelProps {
  predictions: CrowdPrediction[];
  className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  crowd_movement: Users,
  congestion: AlertTriangle,
  queue_growth: Timer,
  gate_overload: Route,
};

const severityColor: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400",
  high: "bg-orange-500/10 text-orange-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-emerald-500/10 text-emerald-400",
};

export function PredictionPanel({ predictions, className }: PredictionPanelProps) {
  if (!predictions || predictions.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4" /> AI Predictions</CardTitle></CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">No predictions available</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          AI Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {predictions.map((pred) => {
          const Icon = typeIcons[pred.type] ?? Brain;
          return (
            <div key={pred.id} className="rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3">
              <div className="mb-1 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">{pred.title}</span>
                </div>
                <Badge variant="outline" className={cn("text-[10px]", severityColor[pred.severity])}>
                  {pred.severity}
                </Badge>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{pred.description}</p>
              <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  {pred.confidence}% confidence
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {pred.timeToOccur}
                </span>
              </div>
              <div className="mb-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-card-foreground">Factors:</span> {pred.contributingFactors.slice(0, 2).join(", ")}
              </div>
              {pred.suggestedAction && (
                <div className="flex items-start gap-1.5 rounded bg-primary/5 px-2 py-1.5 text-xs">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <span className="text-card-foreground">{pred.suggestedAction}</span>
                </div>
              )}
              {pred.businessImpact && (
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-card-foreground">Impact:</span> {pred.businessImpact}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
