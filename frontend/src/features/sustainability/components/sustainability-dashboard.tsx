"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RefreshCw, Leaf, Zap, Droplets, Trash2, Wind, Lightbulb, AlertTriangle,
  BarChart3, Beaker, FileText, LayoutDashboard,
} from "lucide-react";
import { sustainabilityService, createInitialState } from "../services/sustainability-service";
import type { SustainabilityState, SimulationScenarioId } from "../types";
import { CommandCenterView } from "./command-center-view";
import { DomainView } from "./domain-view";
import { CarbonView } from "./carbon-view";
import { RecommendationsView } from "./recommendations-view";
import { AlertsView } from "./sustainability-alerts-view";
import { SimulationView } from "./simulation-view";
import { AnalyticsView } from "./sustainability-analytics-view";
import { ReportsView } from "./sustainability-reports-view";

type Tab = "overview" | "energy" | "water" | "waste" | "carbon" | "recommendations" | "alerts" | "simulation" | "analytics" | "reports";

const tabs: { id: Tab; label: string; icon: typeof Leaf }[] = [
  { id: "overview", label: "Command Center", icon: LayoutDashboard },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "water", label: "Water", icon: Droplets },
  { id: "waste", label: "Waste", icon: Trash2 },
  { id: "carbon", label: "Carbon", icon: Wind },
  { id: "recommendations", label: "AI Recommendations", icon: Lightbulb },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "simulation", label: "Simulation", icon: Beaker },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "reports", label: "Reports", icon: FileText },
];

export function SustainabilityDashboard() {
  const [state, setState] = useState<SustainabilityState>(createInitialState);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const init = useCallback(() => {
    setLoading(true);
    const s = sustainabilityService.initialize();
    setState(s);
    setLoading(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  const refresh = useCallback(() => {
    setLoading(true);
    setState((prev) => sustainabilityService.refresh(prev));
    setLoading(false);
  }, []);

  const handleSimulate = useCallback((scenarioId: SimulationScenarioId) => {
    setState((prev) => sustainabilityService.runSimulation(prev, scenarioId));
    setActiveTab("simulation");
  }, []);

  const handleAckAlert = useCallback((alertId: string) => {
    setState((prev) => sustainabilityService.acknowledgeAlert(prev, alertId));
  }, []);

  const handleGenerateReport = useCallback(() => {
    setState((prev) => sustainabilityService.generateReport(prev));
    setActiveTab("reports");
  }, []);

  if (loading && !state.summary) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-muted-foreground">
        Initializing Sustainability Intelligence Platform...
      </div>
    );
  }

  const summary = state.summary;
  const unackedAlerts = state.alerts.filter((a) => !a.acknowledged).length;
  const criticalAlerts = state.alerts.filter((a) => !a.acknowledged && a.severity === "critical").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
            <Leaf className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-card-foreground">Sustainability Intelligence</h1>
            <p className="text-[10px] text-muted-foreground">
              AI-powered sustainability operations platform &middot; Last updated: {state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleGenerateReport}>
            <FileText className="mr-1 h-3 w-3" />
            Generate Report
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn("mr-1 h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const isAlertTab = tab.id === "alerts";
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              className={cn("h-7 text-[10px] relative", activeTab !== tab.id && "text-muted-foreground")}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="mr-1 h-3 w-3" />
              {tab.label}
              {isAlertTab && unackedAlerts > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                  {unackedAlerts}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {criticalAlerts > 0 && (
        <Card className="border-red-500/20 bg-red-500/[0.03]">
          <CardContent className="flex items-center gap-2 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span className="text-[10px] text-red-400">
              {criticalAlerts} critical alert{criticalAlerts > 1 ? "s" : ""} require{criticalAlerts === 1 ? "s" : ""} immediate attention
            </span>
            <Button variant="ghost" size="sm" className="ml-auto h-6 text-[10px]" onClick={() => setActiveTab("alerts")}>
              View Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "overview" && (
        <CommandCenterView state={state} summary={summary} onAckAlert={handleAckAlert} />
      )}

      {activeTab === "energy" && (
        <DomainView metrics={state.energyMetrics.map(m => ({
          label: m.assetName, value: `${m.consumptionKw}kW`, sub: `${m.efficiency}% eff · ${m.source}`,
          status: m.efficiency >= 75 ? "healthy" : m.efficiency >= 55 ? "warning" : "critical" as const,
        }))} predictions={state.energyPredictions.map(p => ({
          type: p.type.replace(/_/g, " "), assetName: p.assetName, probability: p.probability,
          action: p.recommendedAction, savings: p.estimatedCostSavings, carbon: p.estimatedCarbonReduction,
        }))} />
      )}

      {activeTab === "water" && (
        <DomainView metrics={state.waterMetrics.map(m => ({
          label: m.assetName, value: `${m.totalConsumptionL.toLocaleString()}L`, sub: `${m.flowRateLmin} L/min · ${m.leakProbability}% leak risk`,
          status: m.leakProbability >= 25 ? "critical" : m.leakProbability >= 15 ? "warning" : "healthy" as const,
        }))} predictions={state.waterPredictions.map(p => ({
          type: p.type.replace(/_/g, " "), assetName: p.assetName, probability: p.probability,
          action: p.recommendedAction, savings: p.estimatedCostSavings, carbon: p.estimatedCarbonReduction,
        }))} />
      )}

      {activeTab === "waste" && (
        <DomainView metrics={state.wasteMetrics.map(m => ({
          label: m.assetName, value: `${m.totalKg}kg`, sub: `${m.fillLevelPct}% full · ${m.recyclablePct}% recyclable`,
          status: m.overflowRisk >= 70 ? "critical" : m.fillLevelPct >= 60 ? "warning" : "healthy" as const,
        }))} predictions={state.wastePredictions.map(p => ({
          type: p.type.replace(/_/g, " "), assetName: p.assetName, probability: p.probability,
          action: p.recommendedAction, savings: p.estimatedCostSavings, carbon: p.estimatedCarbonReduction,
        }))} />
      )}

      {activeTab === "carbon" && <CarbonView state={state} />}
      {activeTab === "recommendations" && <RecommendationsView state={state} />}
      {activeTab === "alerts" && <AlertsView state={state} onAcknowledge={handleAckAlert} />}
      {activeTab === "simulation" && <SimulationView state={state} onRun={handleSimulate as (id: string) => void} />}
      {activeTab === "analytics" && <AnalyticsView state={state} />}
      {activeTab === "reports" && <ReportsView state={state} onGenerate={handleGenerateReport} />}
    </div>
  );
}
