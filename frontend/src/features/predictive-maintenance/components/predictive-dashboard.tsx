"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw, Brain, AlertTriangle, Wrench, Activity, LayoutDashboard, BarChart3, Beaker } from "lucide-react";
import { HealthSummaryCards } from "./health-summary-cards";
import { AssetHealthGrid } from "./asset-health-grid";
import { PredictionPanel } from "./prediction-panel";
import { WorkOrderList } from "./work-order-list";
import { AlertPanel } from "./alert-panel";
import { AnalyticsChart } from "./analytics-chart";
import { SimulationPanel } from "./simulation-panel";
import { MaintenanceStatus } from "./maintenance-status";
import { AssetDetailCard } from "./asset-detail-card";
import { ZoneHealthMap } from "./zone-health-map";
import { RiskMatrix } from "./risk-matrix";
import { AssetTypeBreakdown } from "./asset-type-breakdown";
import { predictiveMaintenanceService, createInitialState, type PredictiveMaintenanceState } from "../services/predictive-service";
import { simulationEngine } from "../services/simulation-engine";
import { healthEngine } from "../services/health-engine";
import { maintenanceEngine } from "../services/maintenance-engine";
import type { AssetHealth } from "../types";

type Tab = "overview" | "assets" | "predictions" | "work-orders" | "alerts" | "simulation" | "analytics";

const tabs: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "assets", label: "Assets", icon: Activity },
  { id: "predictions", label: "Predictions", icon: Brain },
  { id: "work-orders", label: "Work Orders", icon: Wrench },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "simulation", label: "Simulation", icon: Beaker },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function PredictiveDashboard() {
  const [state, setState] = useState<PredictiveMaintenanceState>(createInitialState);
  const [loading, setLoading] = useState(true);
  const [simRunning, setSimRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const init = useCallback(() => {
    setLoading(true);
    const s = predictiveMaintenanceService.initialize();
    setState(s);
    setLoading(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  const refresh = useCallback(() => {
    setLoading(true);
    setState((prev) => predictiveMaintenanceService.refresh(prev));
    setLoading(false);
  }, []);

  const handleSimulate = useCallback((scenarioId: string) => {
    setSimRunning(true);
    setState((prev) => predictiveMaintenanceService.simulateScenario(prev, scenarioId));
    setSimRunning(false);
    setActiveTab("simulation");
  }, []);

  const handleAckAlert = useCallback((alertId: string) => {
    setState((prev) => predictiveMaintenanceService.acknowledgeAlert(prev, alertId));
  }, []);

  const handleCompleteWO = useCallback((woId: string) => {
    setState((prev) => predictiveMaintenanceService.completeWorkOrder(prev, woId));
  }, []);

  const healthArray = Array.from(state.healthMap.values());
  const zones = Array.from(healthEngine.calculateZoneHealth(state.healthMap)).map(([name, val]) => ({
    name,
    ...val,
  }));
  const selectedHealth: AssetHealth | undefined = selectedAsset ? state.healthMap.get(selectedAsset) : undefined;
  const dueCount = maintenanceEngine.calculateDue(state.healthMap);
  const healthScores = healthArray.map((h) => h.healthScore);
  const riskScores = healthArray.map((h) => h.riskScore);

  const TabIcon = tabs.find((t) => t.id === activeTab)?.icon ?? LayoutDashboard;

  if (loading && state.assets.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-muted-foreground">
        Initializing predictive maintenance system...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-card-foreground">AI Predictive Maintenance</h1>
            <p className="text-[10px] text-muted-foreground">
              Real-time fleet health monitoring &middot; Last updated: {state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : "—"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("mr-1 h-3 w-3", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            className={cn("h-7 text-[10px]", activeTab !== tab.id && "text-muted-foreground")}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="mr-1 h-3 w-3" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-3">
          <HealthSummaryCards
            totalAssets={state.summary?.totalAssets ?? 0}
            averageHealthScore={state.summary?.averageHealthScore ?? 0}
            criticalAssets={state.summary?.criticalAssets ?? 0}
            highRiskAssets={state.summary?.highRiskAssets ?? 0}
            openWorkOrders={state.summary?.openWorkOrders ?? 0}
          />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AnalyticsChart trends={state.trends} />
            </div>
            <div className="space-y-3">
              <MaintenanceStatus
                totalAssets={state.summary?.totalAssets ?? 0}
                maintenanceCompliance={state.summary?.maintenanceCompliance ?? 0}
                dueCount={dueCount}
              />
              <RiskMatrix healthScores={healthScores} riskScores={riskScores} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <AssetTypeBreakdown breakdown={state.assetTypeBreakdown} />
            <ZoneHealthMap zones={zones} />
          </div>
          {state.alerts.filter((a) => !a.acknowledged).length > 0 && (
            <Card className="border-amber-500/20 bg-amber-500/[0.02]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-[10px] text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>
                    {state.alerts.filter((a) => !a.acknowledged).length} unacknowledged alerts &middot;{" "}
                    {state.summary?.highProbabilityFailures ?? 0} high-probability failures predicted
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "assets" && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          <div className="xl:col-span-3">
            <AssetHealthGrid
              assets={healthArray}
              selectedId={selectedAsset}
              onSelect={setSelectedAsset}
            />
          </div>
          <div className="xl:col-span-1">
            {selectedHealth ? (
              <AssetDetailCard health={selectedHealth} />
            ) : (
              <Card className="border-primary/10">
                <CardContent className="flex h-40 items-center justify-center p-4">
                  <p className="text-center text-[10px] text-muted-foreground">
                    Select an asset to view detailed metrics
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "predictions" && (
        <PredictionPanel predictions={state.predictions} />
      )}

      {activeTab === "work-orders" && (
        <WorkOrderList orders={state.workOrders} onComplete={handleCompleteWO} />
      )}

      {activeTab === "alerts" && (
        <AlertPanel alerts={state.alerts} onAcknowledge={handleAckAlert} />
      )}

      {activeTab === "simulation" && (
        <SimulationPanel
          scenarios={simulationEngine.getScenarios()}
          result={state.simulationResult}
          onRun={handleSimulate}
          running={simRunning}
        />
      )}

      {activeTab === "analytics" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AnalyticsChart trends={state.trends} />
            </div>
            <div className="space-y-3">
              <MaintenanceStatus
                totalAssets={state.summary?.totalAssets ?? 0}
                maintenanceCompliance={state.summary?.maintenanceCompliance ?? 0}
                dueCount={dueCount}
              />
              <RiskMatrix healthScores={healthScores} riskScores={riskScores} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <AssetTypeBreakdown breakdown={state.assetTypeBreakdown} />
            <ZoneHealthMap zones={zones} />
          </div>
        </div>
      )}
    </div>
  );
}
