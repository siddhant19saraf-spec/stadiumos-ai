"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, Timer, Zap, Waves, Brain, Clock } from "lucide-react";
import type { ParkingPrediction, TrafficPrediction } from "../types";

interface PredictionPanelProps {
  predictions: ParkingPrediction[];
  trafficPredictions: TrafficPrediction[];
  className?: string;
}

export function PredictionPanel({ predictions, trafficPredictions, className }: PredictionPanelProps) {
  const avg = useMemo(() => {
    if (predictions.length === 0) return null;
    return {
      avg30: predictions.reduce((s, p) => s + p.predictedOccupancy30m, 0) / predictions.length,
      avg60: predictions.reduce((s, p) => s + p.predictedOccupancy60m, 0) / predictions.length,
      avg120: predictions.reduce((s, p) => s + p.predictedOccupancy120m, 0) / predictions.length,
      avgArrival: predictions.reduce((s, p) => s + p.arrivalRatePerMin, 0) / predictions.length,
      avgDeparture: predictions.reduce((s, p) => s + p.departureRatePerMin, 0) / predictions.length,
      overflowAvg: predictions.reduce((s, p) => s + p.overflowProbability, 0) / predictions.length,
      evAvg: predictions.reduce((s, p) => s + p.evDemandPercent, 0) / predictions.length,
    };
  }, [predictions]);

  if (!avg) return null;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>AI Parking Prediction</span>
          <Badge variant="outline" className="bg-primary/10 text-[10px] text-primary">
            <Brain className="mr-1 h-2.5 w-2.5" />AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <TimeSlot label="30 min" value={`${avg.avg30.toFixed(0)}%`} desc="Predicted occupancy" />
          <TimeSlot label="60 min" value={`${avg.avg60.toFixed(0)}%`} desc="Predicted occupancy" />
          <TimeSlot label="120 min" value={`${avg.avg120.toFixed(0)}%`} desc="Predicted occupancy" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border bg-card p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              Arrival Rate
            </div>
            <p className="text-sm font-semibold text-card-foreground">{avg.avgArrival.toFixed(1)}/min</p>
            <p className="text-[9px] text-muted-foreground">Vehicles arriving per minute</p>
          </div>
          <div className="rounded-md border bg-card p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Timer className="h-3 w-3 text-blue-400" />
              Departure Rate
            </div>
            <p className="text-sm font-semibold text-card-foreground">{avg.avgDeparture.toFixed(1)}/min</p>
            <p className="text-[9px] text-muted-foreground">Vehicles departing per minute</p>
          </div>
          <div className="rounded-md border bg-card p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Waves className="h-3 w-3 text-orange-400" />
              Overflow Prob.
            </div>
            <p className={cn("text-sm font-semibold", avg.overflowAvg > 40 ? "text-red-400" : avg.overflowAvg > 20 ? "text-amber-400" : "text-card-foreground")}>
              {avg.overflowAvg.toFixed(0)}%
            </p>
            <p className="text-[9px] text-muted-foreground">Overflow lot activation probability</p>
          </div>
          <div className="rounded-md border bg-card p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Zap className="h-3 w-3 text-cyan-400" />
              EV Demand
            </div>
            <p className="text-sm font-semibold text-card-foreground">{avg.evAvg.toFixed(0)}%</p>
            <p className="text-[9px] text-muted-foreground">EV charger demand across lots</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-medium text-muted-foreground">Traffic Predictions</p>
          <div className="space-y-1">
            {trafficPredictions.slice(0, 4).map((tp) => (
              <div key={tp.roadId} className="flex items-center justify-between rounded-md bg-muted/20 px-2.5 py-1.5">
                <span className="text-xs">{tp.roadId.replace(/-/g, " ")}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">
                    <Clock className="mr-0.5 inline h-2.5 w-2.5" />
                    {tp.predictedSpeed30m} km/h
                  </span>
                  <Badge variant="outline" className={cn("text-[8px]", tp.predictedCongestion30m === "severe" ? "text-red-400 border-red-500/30" : tp.predictedCongestion30m === "high" ? "text-orange-400" : "text-muted-foreground")}>
                    {tp.predictedCongestion30m}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeSlot({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="rounded-md bg-muted/30 p-2 text-center">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-primary">{value}</p>
      <p className="text-[8px] text-muted-foreground">{desc}</p>
    </div>
  );
}

