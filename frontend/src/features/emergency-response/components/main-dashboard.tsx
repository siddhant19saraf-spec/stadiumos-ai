"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { REFRESH_INTERVAL } from "../constants";
import { emergencyService, type EmergencyState } from "../services/emergency-service";
import { EmergencyStatsCards } from "./emergency-stats-cards";
import { CriticalAlerts } from "./critical-alerts";
import { IncidentFeed } from "./incident-feed";
import { EmergencyMap } from "./emergency-map";
import { PriorityQueue } from "./priority-queue";
import { ResponseTeams } from "./response-teams";
import { ActiveOperations } from "./active-operations";
import { AIRecommendations } from "./ai-recommendations";
import { ResponseTimeline } from "./response-timeline";
import { IncidentDashboard } from "./incident-dashboard";
import { CommandPanel } from "./command-panel";

interface MainDashboardProps {
  className?: string;
}

export function MainDashboard({ className }: MainDashboardProps) {
  const [state, setState] = useState<EmergencyState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    emergencyService.start(REFRESH_INTERVAL);
    const unsub = emergencyService.subscribe(setState);
    return () => {
      unsub();
      emergencyService.stop();
    };
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  const handleCommand = useCallback((type: string, incidentId: string, params: Record<string, string>) => {
    emergencyService.executeCommand(type, incidentId, params);
  }, []);

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    emergencyService.acknowledgeAlert(alertId);
  }, []);

  if (!state) {
    return (
      <div className={cn("flex h-[400px] items-center justify-center", className)}>
        <p className="text-sm text-muted-foreground">Initializing Emergency Command Center...</p>
      </div>
    );
  }

  const { incidents, teams, alerts, recommendations, analytics, mapEntities, lastUpdated } = state;
  const selectedIncident = incidents.find((i) => i.id === selectedId) ?? null;

  return (
    <div className={cn("space-y-5 pb-8", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-card-foreground">Emergency Command Center</h1>
          <p className="text-xs text-muted-foreground">
            {analytics.evacuationStatus !== "none" && (
              <span className="mr-2 font-medium text-amber-400 uppercase">
                Evacuation Status: {analytics.evacuationStatus.replace(/_/g, " ")}
              </span>
            )}
            {analytics.communicationStatus !== "operational" && (
              <span className="mr-2 font-medium text-red-400">
                Comms: {analytics.communicationStatus}
              </span>
            )}
            Updated {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("mr-1 h-3 w-3", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <EmergencyStatsCards analytics={analytics} />

      <CriticalAlerts
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
      />

      <div className="grid gap-5 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-5">
          <IncidentFeed
            incidents={incidents}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <PriorityQueue
            incidents={incidents}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="lg:col-span-3 space-y-5">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <EmergencyMap
                entities={mapEntities}
                selectedIncident={selectedIncident}
              />
            </div>
            <div className="lg:col-span-1 space-y-5">
              <ResponseTimeline incident={selectedIncident} />
              <CommandPanel
                incident={selectedIncident}
                teams={teams}
                onCommand={handleCommand}
              />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <IncidentDashboard incident={selectedIncident} />
            <div className="space-y-5">
              <AIRecommendations recommendations={recommendations.slice(0, 5)} />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ActiveOperations incidents={incidents} teams={teams} />
            <ResponseTeams teams={teams} />
          </div>
        </div>
      </div>
    </div>
  );
}
