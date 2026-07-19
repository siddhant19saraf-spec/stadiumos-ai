// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { REFRESH_INTERVAL } from "../constants";
import { tournamentService, type TournamentState } from "../services/tournament-service";
import { TournamentStatsCards } from "./tournament-stats-cards";
import { VenueReadinessPanel } from "./venue-readiness-panel";
import { MatchList } from "./match-list";
import { ConflictPanel } from "./conflict-panel";
import { AIRecommendations } from "./ai-recommendations";
import { ResourceUtilization } from "./resource-utilization";
import { OperationalTimeline } from "./operational-timeline";
import { PredictiveInsights } from "./predictive-insights";
import { TournamentMap } from "./tournament-map";
import { ExecutiveAnalytics } from "./executive-analytics";

export function MainDashboard({ className }: { className?: string }) {
  const [state, setState] = useState<TournamentState | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    tournamentService.start(REFRESH_INTERVAL);
    const unsub = tournamentService.subscribe(setState);
    return () => {
      unsub();
      tournamentService.stop();
    };
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  const handleApplyRecommendation = useCallback((recId: string) => {
    tournamentService.acknowledgeRecommendation(recId);
  }, []);

  if (!state) {
    return (
      <div className={cn("flex h-[400px] items-center justify-center", className)}>
        <p className="text-sm text-muted-foreground">Initializing Tournament Operations...</p>
      </div>
    );
  }

  const { tournament, venues, matches, conflicts, recommendations, analytics, timeline, predictions, resourceAllocations, lastUpdated } = state;

  return (
    <div className={cn("space-y-5 pb-8", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-card-foreground">Tournament Operations Intelligence</h1>
          <p className="text-xs text-muted-foreground">
            {tournament.name} · {tournament.stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            {" · "}Updated {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("mr-1 h-3 w-3", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <TournamentStatsCards tournament={tournament} analytics={analytics} />

      <div className="grid gap-5 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-5">
          <MatchList
            matches={matches}
            selectedId={selectedMatchId}
            onSelect={setSelectedMatchId}
          />
          <VenueReadinessPanel venues={venues} />
        </div>
        <div className="lg:col-span-3 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <TournamentMap venues={venues} />
            <ExecutiveAnalytics analytics={analytics} dailyStats={analytics.dailyAttendance ?? []} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ConflictPanel conflicts={conflicts} />
            <div className="space-y-5">
              <AIRecommendations recommendations={recommendations} onApply={handleApplyRecommendation} />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <ResourceUtilization resources={resourceAllocations} />
            <OperationalTimeline timeline={timeline} />
            <PredictiveInsights insights={predictions} />
          </div>
        </div>
      </div>
    </div>
  );
}

