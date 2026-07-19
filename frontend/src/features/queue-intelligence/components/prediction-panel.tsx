"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Timer, Brain, Clock, Users } from "lucide-react";
import type { QueuePrediction } from "../types";

interface PredictionPanelProps {
  predictions: QueuePrediction[];
  className?: string;
}

export function PredictionPanel({ predictions, className }: PredictionPanelProps) {
  const avg = useMemo(() => {
    if (predictions.length === 0) return null;
    return {
      avgLength15: predictions.reduce((s, p) => s + p.predictedLength15m, 0) / predictions.length,
      avgLength30: predictions.reduce((s, p) => s + p.predictedLength30m, 0) / predictions.length,
      avgWait15: predictions.reduce((s, p) => s + p.predictedWait15m, 0) / predictions.length,
      avgWait30: predictions.reduce((s, p) => s + p.predictedWait30m, 0) / predictions.length,
      avgOverload: predictions.reduce((s, p) => s + p.overloadProbability, 0) / predictions.length,
      avgAbandonment: predictions.reduce((s, p) => s + p.abandonmentRate, 0) / predictions.length,
      avgConfidence: predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length,
    };
  }, [predictions]);

  const overloads = useMemo(() =>
    predictions.filter((p) => p.overloadProbability > 50).length,
  [predictions]);

  if (!avg) return null;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>AI Queue Prediction</span>
          <Badge variant="outline" className="bg-primary/10 text-[10px] text-primary">
            <Brain className="mr-1 h-2.5 w-2.5" />{avg.avgConfidence.toFixed(0)}% confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TimeSlot icon={Users} label="Queue 15m" value={`${avg.avgLength15.toFixed(0)}`} desc="Predicted length" />
          <TimeSlot icon={Users} label="Queue 30m" value={`${avg.avgLength30.toFixed(0)}`} desc="Predicted length" />
          <TimeSlot icon={Timer} label="Wait 15m" value={`${avg.avgWait15.toFixed(0)} min`} desc="Predicted wait" />
          <TimeSlot icon={Timer} label="Wait 30m" value={`${avg.avgWait30.toFixed(0)} min`} desc="Predicted wait" />
        </div>

        <div className="rounded-md border bg-card p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Brain className="h-3 w-3 text-primary" />
            Key Risk Indicators
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Overload Probability</span>
              <span className={cn("text-xs font-semibold", avg.avgOverload > 40 ? "text-red-400" : avg.avgOverload > 20 ? "text-amber-400" : "text-muted-foreground")}>
                {avg.avgOverload.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Abandonment Rate</span>
              <span className={cn("text-xs font-semibold", avg.avgAbandonment > 20 ? "text-red-400" : avg.avgAbandonment > 10 ? "text-amber-400" : "text-muted-foreground")}>
                {avg.avgAbandonment.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Points at Overload Risk</span>
              <span className="text-xs font-semibold text-orange-400">{overloads}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">Top predictions</p>
          {predictions.filter((p) => p.overloadProbability > 40).slice(0, 4).map((p) => (
            <div key={p.queuePointId} className="flex items-center justify-between rounded-md bg-muted/20 px-2.5 py-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs truncate">{p.queuePointId.replace(/-/g, " ")}</p>
                <p className="text-[9px] text-muted-foreground">
                  <Clock className="mr-0.5 inline h-2 w-2" />
                  Peak: {p.peakDemandTime}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{p.predictedWait15m}/{p.predictedWait30m} min</span>
                <Badge variant="outline" className={cn("text-[8px]", p.overloadProbability > 60 ? "text-red-400 border-red-500/30" : "text-orange-400")}>
                  {p.overloadProbability}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TimeSlot({ icon: Icon, label, value, desc }: { icon: React.ElementType; label: string; value: string; desc: string }) {
  return (
    <div className="rounded-md bg-muted/30 p-2">
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
        <Icon className="h-2.5 w-2.5" />
        {label}
      </div>
      <p className="text-base font-bold text-primary">{value}</p>
      <p className="text-[8px] text-muted-foreground">{desc}</p>
    </div>
  );
}

