"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Car, AlertTriangle, Activity, LayoutDashboard } from "lucide-react";
import { smartParkingService } from "../services/smart-parking-service";
import { ParkingMap } from "./parking-map";
import { CommandCenter } from "./command-center";
import { TrafficPanel } from "./traffic-panel";
import { PredictionPanel } from "./prediction-panel";
import { RecommendationPanel } from "./recommendation-panel";
import { AnalyticsPanel } from "./analytics-panel";
import { AlertPanel } from "./alert-panel";
import { SimulationControls } from "./simulation-controls";
import type { SmartParkingState, SimulationScenario, DashboardTab } from "../types";

const TABS: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "predictions", label: "Predictions", icon: Activity },
  { id: "traffic", label: "Traffic", icon: Car },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "simulation", label: "Simulation", icon: Activity },
];

export function MainDashboard() {
  const [state, setState] = useState<SmartParkingState>(() => smartParkingService.getState());
  const [tab, setTab] = useState<DashboardTab>("overview");

  useEffect(() => {
    smartParkingService.start(5000);
    const unsub = smartParkingService.subscribe(setState);
    return () => { smartParkingService.stop(); unsub(); };
  }, []);

  const handleStartSimulation = useCallback((scenario: SimulationScenario) => {
    smartParkingService.startSimulation(scenario);
  }, []);

  const handleStopSimulation = useCallback(() => {
    smartParkingService.stopSimulation();
  }, []);

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    smartParkingService.acknowledgeAlert(alertId);
  }, []);

  const criticalCount = state.alerts.filter((a) => (a.severity === "critical" || a.severity === "high") && !a.acknowledged).length;

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <header className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Smart Parking & Traffic Intelligence</h1>
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
      </header>

      <CommandCenter state={state} />

      <div className="flex gap-2 border-b">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-[1px]",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-card-foreground",
              )}
              onClick={() => setTab(t.id)}
              role="tab"
              aria-selected={tab === t.id}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <ParkingMap
            lots={state.lots}
            statuses={state.slotStatuses}
            roads={state.roads}
            selectedLotId={state.selectedLotId}
            selectedRoadId={state.selectedRoadId}
            onSelectLot={(id) => smartParkingService.selectLot(id)}
            onSelectRoad={(id) => smartParkingService.selectRoad(id)}
            className="flex-1 min-h-[300px]"
          />
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
          {tab === "overview" && (
            <>
              <RecommendationPanel recommendations={state.recommendations} />
              <AlertPanel alerts={state.alerts} onAcknowledge={handleAcknowledgeAlert} />
            </>
          )}
          {tab === "predictions" && (
            <PredictionPanel predictions={state.predictions} trafficPredictions={state.trafficPredictions} />
          )}
          {tab === "traffic" && (
            <TrafficPanel roads={state.roads} traffic={state.traffic} selectedRoadId={state.selectedRoadId} onSelectRoad={(id) => smartParkingService.selectRoad(id)} />
          )}
          {tab === "alerts" && (
            <AlertPanel alerts={state.alerts} onAcknowledge={handleAcknowledgeAlert} />
          )}
          {tab === "analytics" && (
            <AnalyticsPanel analytics={state.analytics} />
          )}
          {tab === "simulation" && (
            <SimulationControls
              active={state.simulation.active}
              activeScenario={state.simulation.scenario}
              onStart={handleStartSimulation}
              onStop={handleStopSimulation}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
