"use client";

import { useEffect, useState, useCallback } from "react";
import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingPage } from "@/components/loading";
import { HeroSection } from "@/features/command-center/components/hero-section";
import { AIExecutiveSummary } from "@/features/command-center/components/ai-executive-summary";
import { KPICardGrid } from "@/features/command-center/components/kpi-card-grid";
import { AIRecommendations } from "@/features/command-center/components/ai-recommendations";
import { LiveCharts } from "@/features/command-center/components/live-charts";
import { IncidentsTable } from "@/features/command-center/components/incidents-table";
import { ActivityFeed } from "@/features/command-center/components/activity-feed";
import { commandCenterService } from "@/features/command-center/services/command-center-service";
import type { CommandCenterData, AIProviderStatus } from "@/features/command-center/types";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [aiStatus, setAiStatus] = useState<AIProviderStatus>("operational");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [result, status] = await Promise.all([
        commandCenterService.getData(),
        commandCenterService.getAIProviderStatus(),
      ]);
      setData(result);
      setAiStatus(status);
    } catch (error) {
      toast({
        title: "Failed to load data",
        description: error instanceof Error ? error.message : "Unable to fetch command center data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || !data) {
    return (
      <Shell title="Command Center">
        <LoadingPage message="Loading command center..." />
      </Shell>
    );
  }

  return (
    <Shell title="Command Center">
      <ErrorBoundary module="Command Center">
        <div className="space-y-5 pb-8">
          {/* Hero Section */}
          <HeroSection
            stadium={data.stadium}
            tournament={data.tournament}
            match={data.match}
            metrics={data.hero}
            aiStatus={aiStatus}
          />

          {/* AI Executive Summary */}
          <AIExecutiveSummary
            summary={data.summary.summary}
            highlights={data.summary.highlights}
            generatedAt={data.summary.generatedAt}
            isRefreshing={isRefreshing}
          />

          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="gap-2 text-xs"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {/* KPI Cards */}
          <KPICardGrid metrics={data.kpis} />

          {/* Main Grid: Recommendations + Charts + Activity */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Left Column: Recommendations */}
            <div className="lg:col-span-1 space-y-5">
              <AIRecommendations
                recommendations={data.recommendations}
                onApply={(id) => toast({ title: "Recommendation applied", description: `Recommendation ${id} applied`, variant: "default" })}
                onDismiss={(_id) => toast({ title: "Recommendation dismissed", variant: "default" })}
              />
            </div>

            {/* Middle + Right: Charts + Incidents + Activity */}
            <div className="lg:col-span-2 space-y-5">
              <LiveCharts
                attendanceTimeline={data.attendanceTimeline}
                crowdDensityTrend={data.crowdDensityTrend}
                parkingOccupancy={data.parkingOccupancy}
                queueForecast={data.queueForecast}
                incidentTimeline={data.incidentTimeline}
                energyUsage={data.energyUsage}
                revenueTrend={data.revenueTrend}
              />
            </div>
          </div>

          {/* Bottom Grid: Incidents + Activity Feed */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <IncidentsTable
                incidents={data.incidents}
                onViewIncident={(id) => toast({ title: "Viewing incident", description: `Opening incident ${id}` })}
              />
            </div>
            <div className="lg:col-span-1">
              <ActivityFeed events={data.activityFeed} />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
