"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle } from "lucide-react";
import { digitalTwinService } from "../services/digital-twin-service";
import { StadiumMap } from "./stadium-map";
import { LayerControls } from "./layer-controls";
import { ZoneDetailPanel } from "./zone-detail-panel";
import { SearchBar } from "./search-bar";
import { SimulationControls } from "./simulation-controls";
import { TimeTravelControls } from "./time-travel-controls";
import { AIInsightPanel } from "./ai-insight-panel";
import { LiveIncidentsPanel } from "./live-incidents-panel";
import { AnalyticsPanel } from "./analytics-panel";
import type { DigitalTwinState, SimulationScenario } from "../types";


export function MainDashboard() {
  const [state, setState] = useState<DigitalTwinState>(() => digitalTwinService.getState());

  useEffect(() => {
    digitalTwinService.start(5000);
    const unsub = digitalTwinService.subscribe(setState);
    return () => {
      digitalTwinService.stop();
      unsub();
    };
  }, []);

  const selectedZone = state.selectedZoneId
    ? state.zones.find((z) => z.id === state.selectedZoneId) ?? null
    : null;
  const selectedStatus = state.selectedZoneId
    ? state.zoneStatuses.get(state.selectedZoneId) ?? null
    : null;
  const selectedRec = state.selectedZoneId
    ? state.recommendations.get(state.selectedZoneId) ?? null
    : null;

  const handleZoneSelect = useCallback((zoneId: string) => {
    digitalTwinService.selectZone(zoneId);
  }, []);

  const handleStartSimulation = useCallback((scenario: SimulationScenario) => {
    digitalTwinService.startSimulation(scenario);
  }, []);

  const handleStopSimulation = useCallback(() => {
    digitalTwinService.stopSimulation();
  }, []);

  const criticalCount = state.incidents.filter(
    (i) => (i.status === "active" || i.status === "acknowledged") && (i.severity === "critical" || i.severity === "high"),
  ).length;

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <header className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">AI Stadium Digital Twin</h1>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="bg-emerald-500/10 text-[10px] text-emerald-400">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              LIVE
            </Badge>
            {criticalCount > 0 && (
              <Badge className="bg-red-500/10 text-[10px] text-red-400">
                <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                {criticalCount} critical
              </Badge>
            )}
          </div>
        </div>
        <SearchBar zones={state.zones} onSelect={handleZoneSelect} className="w-64" />
      </header>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto">
          <LayerControls layers={state.layers} onToggle={(id) => digitalTwinService.toggleLayer(id)} />
          <SimulationControls
            active={state.simulation.active}
            activeScenario={state.simulation.scenario}
            onStart={handleStartSimulation}
            onStop={handleStopSimulation}
          />
          <TimeTravelControls
            timeTravel={state.timeTravel}
            snapshots={state.snapshots}
            onStart={() => digitalTwinService.startTimeTravel()}
            onStop={() => digitalTwinService.stopTimeTravel()}
          />
        </aside>

        <main className="flex flex-1 flex-col gap-4 overflow-hidden">
          <StadiumMap
            zones={state.zones}
            statuses={state.zoneStatuses}
            layers={state.layers}
            entities={state.entities}
            selectedZoneId={state.selectedZoneId}
            highlightedAssetId={state.highlightedAssetId}
            onSelectZone={handleZoneSelect}
            className="flex-1 min-h-[400px]"
          />
          <div className="grid grid-cols-2 gap-4">
            <AIInsightPanel insights={state.insights} />
            <AnalyticsPanel analytics={state.analytics} zoneStatuses={state.zoneStatuses} />
          </div>
        </main>

        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
          <ZoneDetailPanel zone={selectedZone} status={selectedStatus} recommendation={selectedRec} />
          <LiveIncidentsPanel incidents={state.incidents} onSelect={handleZoneSelect} />
        </aside>
      </div>
    </div>
  );
}

