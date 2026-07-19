// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Timer, AlertTriangle, Activity, LayoutDashboard } from "lucide-react";
import { queueIntelligenceService } from "../services/queue-service";
import { QueueMap } from "./queue-map";
import { CommandCenter } from "./command-center";
import { QueueMonitor } from "./queue-monitor";
import { PredictionPanel } from "./prediction-panel";
import { RecommendationPanel } from "./recommendation-panel";
import { InventoryPanel } from "./inventory-panel";
import { AnalyticsPanel } from "./analytics-panel";
import { AlertPanel } from "./alert-panel";
import { SimulationControls } from "./simulation-controls";
import type { QueueIntelligenceState, SimulationScenario, DashboardTab } from "../types";

const TABS: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "queues", label: "Queues", icon: Timer },
  { id: "predictions", label: "Predictions", icon: Activity },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "simulation", label: "Simulation", icon: Activity },
];

export function MainDashboard() {
  const [state, setState] = useState<QueueIntelligenceState>(() => queueIntelligenceService.getState());
  const [tab, setTab] = useState<DashboardTab>("overview");

  useEffect(() => {
    queueIntelligenceService.start(5000);
    const unsub = queueIntelligenceService.subscribe(setState);
    return () => { queueIntelligenceService.stop(); unsub(); };
  }, []);

  const handleStartSimulation = useCallback((scenario: SimulationScenario) => {
    queueIntelligenceService.startSimulation(scenario);
  }, []);

  const handleStopSimulation = useCallback(() => {
    queueIntelligenceService.stopSimulation();
  }, []);

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    queueIntelligenceService.acknowledgeAlert(alertId);
  }, []);

  const criticalCount = state.alerts.filter((a) => (a.severity === "critical" || a.severity === "high") && !a.acknowledged).length;

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <header className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <Timer className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Queue Intelligence & Smart Concessions</h1>
          <Badge variant="outline" className="bg-emerald-500/10 text-[10px] text-emerald-400">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />LIVE
          </Badge>
          {criticalCount > 0 && (
            <Badge className="bg-red-500/10 text-[10px] text-red-400">
              <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />{criticalCount} critical
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
              className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-[1px]", tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-card-foreground")}
              onClick={() => setTab(t.id)}
              role="tab" aria-selected={tab === t.id}
            >
              <Icon className="h-3.5 w-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <QueueMap
            points={state.queuePoints}
            statuses={state.queueStatuses}
            selectedQueueId={state.selectedQueueId}
            onSelect={(id) => queueIntelligenceService.selectQueue(id)}
            className="flex-1 min-h-[250px]"
          />
          <QueueMonitor
            points={state.queuePoints}
            statuses={state.queueStatuses}
            selectedQueueId={state.selectedQueueId}
            onSelect={(id) => queueIntelligenceService.selectQueue(id)}
          />
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
          {tab === "overview" && (
            <>
              <RecommendationPanel recommendations={state.recommendations} />
              <AlertPanel alerts={state.alerts} onAcknowledge={handleAcknowledgeAlert} />
            </>
          )}
          {tab === "queues" && <QueueMonitor points={state.queuePoints} statuses={state.queueStatuses} selectedQueueId={state.selectedQueueId} onSelect={(id) => queueIntelligenceService.selectQueue(id)} />}
          {tab === "predictions" && <PredictionPanel predictions={state.predictions} />}
          {tab === "inventory" && <InventoryPanel inventory={state.inventoryStatuses} />}
          {tab === "analytics" && <AnalyticsPanel analytics={state.analytics} />}
          {tab === "alerts" && <AlertPanel alerts={state.alerts} onAcknowledge={handleAcknowledgeAlert} />}
          {tab === "simulation" && <SimulationControls active={state.simulation.active} activeScenario={state.simulation.scenario} onStart={handleStartSimulation} onStop={handleStopSimulation} />}
        </aside>
      </div>
    </div>
  );
}

