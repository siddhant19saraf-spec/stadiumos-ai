// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { REFRESH_INTERVAL } from "../constants";
import { crowdService, type CrowdState } from "../services/crowd-service";
import { CrowdStatsCards } from "./crowd-stats-cards";
import { CrowdHeatmap } from "./crowd-heatmap";
import { ZoneStatusPanel } from "./zone-status-panel";
import { RiskAssessmentPanel } from "./risk-assessment-panel";
import { PredictionPanel } from "./prediction-panel";
import { RecommendationPanel } from "./recommendation-panel";
import { AlertBanner } from "./alert-banner";
import { InsightPanel } from "./insight-panel";
import { CrowdTimelineChart } from "./crowd-timeline-chart";
import { GateUtilizationPanel } from "./gate-utilization-panel";
import { QueueGrowthPanel } from "./queue-growth-panel";

interface MainDashboardProps {
  className?: string;
}

export function MainDashboard({ className }: MainDashboardProps) {
  const [state, setState] = useState<CrowdState | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    crowdService.start(REFRESH_INTERVAL);
    const unsub = crowdService.subscribe(setState);
    return () => {
      unsub();
      crowdService.stop();
    };
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  if (!state) {
    return (
      <div className={cn("flex h-[400px] items-center justify-center", className)}>
        <p className="text-sm text-muted-foreground">Initializing crowd intelligence...</p>
      </div>
    );
  }

  const { zones, analytics, predictions, recommendations, alerts, insights, timeline, gateUtilization, queueGrowth, eventPhase } = state;

  return (
    <div className={cn("space-y-5 pb-8", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-card-foreground">Crowd Intelligence & Predictive Analytics</h1>
          <p className="text-xs text-muted-foreground">
            Event phase: <span className="font-medium capitalize text-card-foreground">{eventPhase.replace(/_/g, " ")}</span>
            {" · "}Updated {new Date(state.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("mr-1 h-3 w-3", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <AlertBanner alerts={alerts ?? []} />

      <CrowdStatsCards analytics={analytics} isRefreshing={isRefreshing} />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <CrowdHeatmap zones={zones} />
        </div>
        <div className="lg:col-span-3 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <RiskAssessmentPanel analytics={analytics} />
            <ZoneStatusPanel zones={zones} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CrowdTimelineChart timeline={timeline} />
        </div>
        <div className="lg:col-span-1">
          <InsightPanel insights={insights} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PredictionPanel predictions={predictions} />
        <RecommendationPanel recommendations={recommendations} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <GateUtilizationPanel gates={gateUtilization} />
        <QueueGrowthPanel queueGrowth={queueGrowth} />
      </div>
    </div>
  );
}

