"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, Brain, AlertTriangle, Gauge } from "lucide-react";
import type { PredictiveInsight } from "../types";

interface PredictiveInsightsProps {
  insights: PredictiveInsight[];
  className?: string;
}

const severityColor: Record<string, string> = {
  critical: "border-l-red-500 bg-red-500/5",
  high: "border-l-orange-500 bg-orange-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-emerald-500 bg-emerald-500/5",
};
const severityBadge: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400",
  high: "bg-orange-500/10 text-orange-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-emerald-500/10 text-emerald-400",
};

const typeIcons: Record<string, React.ElementType> = {
  schedule_delay: ClockIcon, resource_shortage: AlertTriangle,
  attendance: TrendingUp, parking_overflow: Gauge,
  staff_requirement: Gauge, emergency_probability: AlertTriangle,
  weather_impact: AlertTriangle,
};
function ClockIcon({ className }: { className?: string }) { return <TrendingUp className={className} />; }

export function PredictiveInsights({ insights, className }: PredictiveInsightsProps) {
  if (insights.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Brain className="h-4 w-4" /> AI Predictions</CardTitle></CardHeader>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">No predictions available</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          AI Predictive Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[500px] space-y-3 overflow-y-auto">
        {insights.map((insight) => {
          const Icon = typeIcons[insight.type] ?? TrendingUp;
          return (
            <div key={insight.id} className={cn("rounded-md border-l-4 p-3", severityColor[insight.severity])}>
              <div className="mb-1 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">{insight.title}</span>
                </div>
                <Badge variant="outline" className={cn("text-[9px]", severityBadge[insight.severity])}>
                  {insight.severity}
                </Badge>
              </div>
              <p className="mb-1 text-xs text-muted-foreground">{insight.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Brain className="h-3 w-3" />{insight.confidence}% conf</span>
                <span>P({insight.probability}%)</span>
                <span>{insight.timeframe}</span>
              </div>
              <div className="mt-1.5 flex items-start gap-1.5 rounded bg-primary/5 px-2 py-1 text-[10px]">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                <span className="text-card-foreground">{insight.suggestedAction}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
