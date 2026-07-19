"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RefreshCw, Leaf, Zap, Droplets, Trash2, Wind, Lightbulb, AlertTriangle,
  BarChart3, Beaker, FileText, LayoutDashboard, TrendingUp, Award, Target,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { sustainabilityService, createInitialState } from "../services/sustainability-service";
import { simulationEngine } from "../services/simulation-engine";
import type { SustainabilityState } from "../types";

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

  const handleSimulate = useCallback((scenarioId: string) => {
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

      {/* Tab Navigation */}
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

      {/* Critical Alert Bar */}
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

      {/* Command Center Tab */}
      {activeTab === "overview" && (
        <CommandCenterView
          state={state}
          summary={summary}
          onSimulate={handleSimulate}
          onAckAlert={handleAckAlert}
        />
      )}

      {activeTab === "energy" && <EnergyView state={state} />}
      {activeTab === "water" && <WaterView state={state} />}
      {activeTab === "waste" && <WasteView state={state} />}
      {activeTab === "carbon" && <CarbonView state={state} />}
      {activeTab === "recommendations" && <RecommendationsView state={state} />}
      {activeTab === "alerts" && <AlertsView state={state} onAcknowledge={handleAckAlert} />}
      {activeTab === "simulation" && <SimulationView state={state} onRun={handleSimulate} />}
      {activeTab === "analytics" && <AnalyticsView state={state} />}
      {activeTab === "reports" && <ReportsView state={state} onGenerate={handleGenerateReport} />}
    </div>
  );
}

function CommandCenterView({ state, summary, onSimulate, onAckAlert }: {
  state: SustainabilityState;
  summary: SustainabilityState["summary"];
  onSimulate: (id: string) => void;
  onAckAlert: (id: string) => void;
}) {
  if (!summary) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
        <KpiCard label="Total Energy" value={`${(summary.totalEnergyKwh / 1000).toFixed(1)}k`} sub="kWh" icon={Zap} color="text-amber-400" bg="bg-amber-500/10" trend={summary.totalEnergyKwh > 40000 ? "up" : "neutral"} />
        <KpiCard label="Live Power Demand" value={`${summary.livePowerDemandKw.toFixed(0)}`} sub="kW" icon={TrendingUp} color="text-orange-400" bg="bg-orange-500/10" trend={summary.livePowerDemandKw > 2000 ? "up" : "neutral"} />
        <KpiCard label="Water Consumption" value={`${(summary.totalWaterL / 1000).toFixed(0)}`} sub="kL" icon={Droplets} color="text-blue-400" bg="bg-blue-500/10" trend={summary.totalWaterL > 50000 ? "up" : "neutral"} />
        <KpiCard label="Carbon Emissions" value={`${(summary.totalCO2Kg / 1000).toFixed(1)}`} sub="tCO₂e" icon={Wind} color={summary.totalCO2Kg > 22000 ? "text-red-400" : "text-emerald-400"} bg="bg-red-500/10" trend={summary.totalCO2Kg > 22000 ? "up" : "down"} />
        <KpiCard label="Waste Generated" value={summary.wasteGeneratedKg} sub="kg" icon={Trash2} color="text-purple-400" bg="bg-purple-500/10" trend={summary.wasteGeneratedKg > 400 ? "up" : "down"} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiCard label="Renewable Energy" value={`${summary.renewablePct}%`} sub="of total mix" icon={Leaf} color="text-emerald-400" bg="bg-emerald-500/10" trend={summary.renewablePct > 30 ? "up" : "neutral"} />
        <KpiCard label="Operational Efficiency" value={`${summary.operationalEfficiency}%`} sub="fleet average" icon={BarChart3} color={summary.operationalEfficiency >= 70 ? "text-emerald-400" : "text-amber-400"} bg="bg-primary/10" trend={summary.operationalEfficiency >= 70 ? "up" : "down"} />
        <KpiCard label="Sustainability Score" value={summary.sustainabilityScore} sub="/100" icon={Award} color={summary.sustainabilityScore >= 70 ? "text-emerald-400" : "text-amber-400"} bg="bg-emerald-500/10" trend={summary.sustainabilityScore >= 70 ? "up" : "neutral"} />
        <KpiCard label="Net-Zero Progress" value={`${summary.netZeroProgress}%`} sub="toward 2035 target" icon={Target} color="text-cyan-400" bg="bg-cyan-500/10" trend={summary.netZeroProgress > 40 ? "up" : "neutral"} />
      </div>

      {state.recommendations.length > 0 && (
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Top AI Recommendations</h3>
            <div className="space-y-1.5">
              {state.recommendations.slice(0, 4).map((rec) => (
                <div key={rec.id} className="flex items-start gap-2 rounded-md bg-primary/5 px-2 py-1.5">
                  <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-card-foreground">{rec.title}</span>
                      <Badge variant="outline" className={cn("text-[8px]", rec.priority === "p0" ? "text-red-400 border-red-500/20" : rec.priority === "p1" ? "text-orange-400" : "text-muted-foreground")}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      ${rec.estimatedCostSavings.toLocaleString()} savings &middot; {rec.estimatedCarbonReduction.toLocaleString()} kg CO₂ reduction
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {state.alerts.filter((a) => !a.acknowledged).length > 0 && (
        <Card className="border-amber-500/20">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Active Alerts ({state.alerts.filter((a) => !a.acknowledged).length})</h3>
            <div className="space-y-1.5">
              {state.alerts.filter((a) => !a.acknowledged).slice(0, 5).map((alert) => (
                <div key={alert.id} className={cn(
                  "flex items-start gap-2 rounded-md px-2 py-1.5",
                  alert.severity === "critical" ? "bg-red-500/10" : alert.severity === "high" ? "bg-orange-500/10" : "bg-amber-500/10",
                )}>
                  <AlertTriangle className={cn("mt-0.5 h-3 w-3 shrink-0", alert.severity === "critical" ? "text-red-400" : "text-amber-400")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-card-foreground">{alert.title}</p>
                    <p className="text-[10px] text-muted-foreground">{alert.message.substring(0, 80)}...</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 shrink-0 text-[10px]" onClick={() => onAckAlert(alert.id)}>
                    Ack
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EnergyView({ state }: { state: SustainabilityState }) {
  return <DomainView title="Energy Intelligence" icon={Zap} color="text-amber-400" bg="bg-amber-500/10" metrics={state.energyMetrics.map(m => ({
    label: m.assetName, value: `${m.consumptionKw}kW`, sub: `${m.efficiency}% eff · ${m.source}`,
    status: m.efficiency >= 75 ? "healthy" : m.efficiency >= 55 ? "warning" : "critical" as const,
  }))} predictions={state.energyPredictions.map(p => ({
    type: p.type.replace(/_/g, " "), assetName: p.assetName, probability: p.probability,
    action: p.recommendedAction, savings: p.estimatedCostSavings, carbon: p.estimatedCarbonReduction,
  }))} />;
}

function WaterView({ state }: { state: SustainabilityState }) {
  return <DomainView title="Water Management" icon={Droplets} color="text-blue-400" bg="bg-blue-500/10" metrics={state.waterMetrics.map(m => ({
    label: m.assetName, value: `${m.totalConsumptionL.toLocaleString()}L`, sub: `${m.flowRateLmin} L/min · ${m.leakProbability}% leak risk`,
    status: m.leakProbability >= 25 ? "critical" : m.leakProbability >= 15 ? "warning" : "healthy" as const,
  }))} predictions={state.waterPredictions.map(p => ({
    type: p.type.replace(/_/g, " "), assetName: p.assetName, probability: p.probability,
    action: p.recommendedAction, savings: p.estimatedCostSavings, carbon: p.estimatedCarbonReduction,
  }))} />;
}

function WasteView({ state }: { state: SustainabilityState }) {
  return <DomainView title="Waste Management" icon={Trash2} color="text-purple-400" bg="bg-purple-500/10" metrics={state.wasteMetrics.map(m => ({
    label: m.assetName, value: `${m.totalKg}kg`, sub: `${m.fillLevelPct}% full · ${m.recyclablePct}% recyclable`,
    status: m.overflowRisk >= 70 ? "critical" : m.fillLevelPct >= 60 ? "warning" : "healthy" as const,
  }))} predictions={state.wastePredictions.map(p => ({
    type: p.type.replace(/_/g, " "), assetName: p.assetName, probability: p.probability,
    action: p.recommendedAction, savings: p.estimatedCostSavings, carbon: p.estimatedCarbonReduction,
  }))} />;
}

function CarbonView({ state }: { state: SustainabilityState }) {
  const c = state.carbonMetrics;
  if (!c) return <div className="text-xs text-muted-foreground">Loading carbon data...</div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiCard label="Scope 1 (Direct)" value={`${c.scope1.toFixed(0)}`} sub="kg CO₂" icon={Wind} color="text-red-400" bg="bg-red-500/10" />
        <KpiCard label="Scope 2 (Grid)" value={`${c.scope2.toFixed(0)}`} sub="kg CO₂" icon={Zap} color="text-orange-400" bg="bg-orange-500/10" />
        <KpiCard label="Scope 3 (Supply Chain)" value={`${c.scope3.toFixed(0)}`} sub="kg CO₂" icon={BarChart3} color="text-amber-400" bg="bg-amber-500/10" />
        <KpiCard label="Total CO₂" value={`${(c.totalCO2 / 1000).toFixed(1)}`} sub="tCO₂e" icon={Wind} color={c.totalCO2 > 22000 ? "text-red-400" : "text-emerald-400"} bg="bg-red-500/10" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiCard label="CO₂ Intensity" value={c.co2PerKwh.toFixed(4)} sub="kg/kWh" icon={BarChart3} color="text-muted-foreground" bg="bg-primary/10" />
        <KpiCard label="Renewable %" value={`${c.renewablePct}%`} sub="of energy mix" icon={Leaf} color="text-emerald-400" bg="bg-emerald-500/10" />
        <KpiCard label="Carbon Offset" value={`${c.carbonOffset.toFixed(0)}`} sub="kg CO₂" icon={TrendingUp} color="text-cyan-400" bg="bg-cyan-500/10" />
        <KpiCard label="Net CO₂" value={`${c.netCO2.toFixed(0)}`} sub="kg CO₂" icon={Target} color={c.netCO2 < 20000 ? "text-emerald-400" : "text-red-400"} bg="bg-emerald-500/10" />
      </div>
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Emissions Breakdown</h3>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scope 1 (Generators, fleet)</span>
              <span className="font-medium tabular-nums">{c.scope1.toFixed(0)} kg</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-red-500" style={{ width: `${(c.scope1 / Math.max(1, c.totalCO2)) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scope 2 (Grid electricity)</span>
              <span className="font-medium tabular-nums">{c.scope2.toFixed(0)} kg</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-orange-500" style={{ width: `${(c.scope2 / Math.max(1, c.totalCO2)) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scope 3 (Water, waste, supply chain)</span>
              <span className="font-medium tabular-nums">{c.scope3.toFixed(0)} kg</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${(c.scope3 / Math.max(1, c.totalCO2)) * 100}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>
      {state.energyPredictions.filter((p) => p.type === "demand_forecast").length > 0 && (
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Carbon Forecast (12 months)</h3>
            <div className="text-[10px] text-muted-foreground">
              <p>Projected trajectory: {c.netCO2 < 20000 ? "On track" : "Requires acceleration"} for 2035 net-zero target</p>
              <p className="mt-1">Current reduction rate: {Math.round((1 - c.netCO2 / 25000) * 100)}% toward goal</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecommendationsView({ state }: { state: SustainabilityState }) {
  const categories = ["energy", "water", "waste", "carbon", "operations"] as const;
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? state.recommendations : state.recommendations.filter((r) => r.category === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        {categories.map((c) => (
          <Button key={c} variant={filter === c ? "default" : "ghost"} size="sm" className="h-7 text-[10px] capitalize" onClick={() => setFilter(c)}>{c}</Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No recommendations in this category
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((rec) => (
            <Card key={rec.id} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-sm font-medium text-card-foreground">{rec.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", rec.priority === "p0" ? "text-red-400 border-red-500/20" : rec.priority === "p1" ? "text-orange-400 border-orange-500/20" : "text-muted-foreground")}>
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{rec.category}</Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
                  <div className="rounded-md bg-amber-500/5 p-1.5">
                    <p className="text-muted-foreground">Cost Savings</p>
                    <p className="font-medium tabular-nums text-amber-400">${rec.estimatedCostSavings.toLocaleString()}</p>
                  </div>
                  <div className="rounded-md bg-emerald-500/5 p-1.5">
                    <p className="text-muted-foreground">Carbon Reduction</p>
                    <p className="font-medium tabular-nums text-emerald-400">{rec.estimatedCarbonReduction.toLocaleString()} kg</p>
                  </div>
                  <div className="rounded-md bg-blue-500/5 p-1.5">
                    <p className="text-muted-foreground">ROI</p>
                    <p className="font-medium tabular-nums text-blue-400">{rec.roi}x</p>
                  </div>
                  <div className="rounded-md bg-purple-500/5 p-1.5">
                    <p className="text-muted-foreground">Payback</p>
                    <p className="font-medium tabular-nums text-purple-400">{rec.paybackDays} days</p>
                  </div>
                </div>
                {rec.automationPossible && (
                  <div className="mt-1.5 rounded bg-primary/5 px-2 py-1 text-[10px] text-primary">
                    AI automation available — can be implemented without manual intervention
                  </div>
                )}
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                    AI Reasoning
                  </summary>
                  <div className="mt-1 space-y-0.5 pl-2">
                    {rec.reasoning.map((r, i) => (
                      <p key={i} className="text-[10px] text-muted-foreground">• {r}</p>
                    ))}
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertsView({ state, onAcknowledge }: { state: SustainabilityState; onAcknowledge: (id: string) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? state.alerts : filter === "unacked" ? state.alerts.filter((a) => !a.acknowledged) : state.alerts.filter((a) => a.severity === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        <Button variant={filter === "unacked" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("unacked")}>Unacknowledged</Button>
        <Button variant={filter === "critical" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("critical")}>Critical</Button>
        <Button variant={filter === "high" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("high")}>High</Button>
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No alerts match the current filter
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => (
            <Card key={alert.id} className={cn(
              "border-l-4 border-primary/10",
              alert.severity === "critical" ? "border-l-red-500" : alert.severity === "high" ? "border-l-orange-500" : alert.severity === "medium" ? "border-l-amber-500" : "border-l-blue-500",
              alert.acknowledged && "opacity-50",
            )}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("h-3.5 w-3.5", alert.severity === "critical" ? "text-red-400" : "text-amber-400")} />
                      <span className="text-sm font-medium text-card-foreground">{alert.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", alert.severity === "critical" ? "text-red-400 border-red-500/20" : alert.severity === "high" ? "text-orange-400 border-orange-500/20" : "text-muted-foreground")}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{alert.category.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{alert.message}</p>
                  </div>
                  {!alert.acknowledged && (
                    <Button variant="ghost" size="sm" className="h-7 shrink-0 text-[10px]" onClick={() => onAcknowledge(alert.id)}>
                      Acknowledge
                    </Button>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>Current: {alert.currentValue}{alert.unit}</span>
                  <span>Threshold: {alert.thresholdValue}{alert.unit}</span>
                  {alert.requiresAction && <span className="text-red-400">Action required</span>}
                </div>
                <div className="mt-1.5 rounded bg-primary/5 px-2 py-1 text-[10px] text-muted-foreground">
                  <span className="text-primary">AI Suggestion:</span> {alert.aiSuggestion}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SimulationView({ state, onRun }: { state: SustainabilityState; onRun: (id: string) => void }) {
  const scenarios = simulationEngine.getScenarios();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {scenarios.map((s: { id: string; title: string; category: string; description: string; impactMetrics: { energyIncreasePct: number; waterIncreasePct: number; carbonIncreasePct: number } }) => (
          <Card key={s.id} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-card-foreground">{s.title}</span>
                  <Badge variant="outline" className="ml-2 text-[10px] capitalize text-muted-foreground">{s.category}</Badge>
                </div>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{s.description}</p>
              <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                <span>Energy impact: +{s.impactMetrics.energyIncreasePct}%</span>
                <span className="ml-2">Water: +{s.impactMetrics.waterIncreasePct}%</span>
                <span className="ml-2">Carbon: +{s.impactMetrics.carbonIncreasePct}%</span>
              </div>
              <Button variant="outline" size="sm" className="mt-2 h-7 w-full text-[10px]" onClick={() => onRun(s.id)}>
                <Beaker className="mr-1 h-3 w-3" />
                Run Simulation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {state.simulationResult && (
        <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardContent className="p-4">
            <h3 className="mb-3 text-xs font-medium text-card-foreground">
              Simulation Results: {state.simulationResult.scenarioTitle}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-red-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Predicted Energy</p>
                <p className="text-sm font-bold text-red-400">{state.simulationResult.predictedEnergyKwh.toLocaleString()} kWh</p>
              </div>
              <div className="rounded-md bg-emerald-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Mitigated Energy</p>
                <p className="text-sm font-bold text-emerald-400">{state.simulationResult.mitigatedEnergyKwh.toLocaleString()} kWh</p>
              </div>
              <div className="rounded-md bg-red-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Predicted Cost</p>
                <p className="text-sm font-bold text-red-400">${state.simulationResult.predictedCost.toLocaleString()}</p>
              </div>
              <div className="rounded-md bg-emerald-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Cost Savings</p>
                <p className="text-sm font-bold text-emerald-400">${state.simulationResult.costSavings.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Energy Savings</p>
                <p className="text-xs font-medium tabular-nums">{state.simulationResult.energySavingsPct}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Carbon Savings</p>
                <p className="text-xs font-medium tabular-nums">{state.simulationResult.carbonSavingsPct}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Water Impact</p>
                <p className="text-xs font-medium tabular-nums">{state.simulationResult.waterSavingsPct}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Predicted CO₂</p>
                <p className="text-xs font-medium tabular-nums">{state.simulationResult.predictedCO2Kg.toLocaleString()} kg</p>
              </div>
            </div>
            {state.simulationResult.recommendedActions.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">AI Strategies:</p>
                {state.simulationResult.aiStrategies.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <div className="flex-1">
                      <span>{s.action}</span>
                      <span className="ml-2 text-emerald-400">({s.impact})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnalyticsView({ state }: { state: SustainabilityState }) {
  return (
    <div className="space-y-3">
      <Card className="border-primary/10">
        <CardContent className="p-4">
          <h3 className="mb-3 text-xs font-medium text-card-foreground">ESG KPI Dashboard</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {state.esgKpis.map((kpi) => (
              <div key={kpi.metric} className={cn(
                "rounded-md border p-2",
                kpi.status === "achieved" ? "border-emerald-500/30 bg-emerald-500/5" :
                kpi.status === "on_track" ? "border-blue-500/30 bg-blue-500/5" :
                kpi.status === "at_risk" ? "border-amber-500/30 bg-amber-500/5" :
                "border-red-500/30 bg-red-500/5",
              )}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground capitalize">{kpi.category}</p>
                  <span className={cn(
                    "text-[8px] rounded-full px-1.5 py-0.5",
                    kpi.status === "achieved" ? "bg-emerald-500/20 text-emerald-400" :
                    kpi.status === "on_track" ? "bg-blue-500/20 text-blue-400" :
                    kpi.status === "at_risk" ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400",
                  )}>
                    {kpi.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-card-foreground">{kpi.metric}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold tabular-nums">{kpi.value}</span>
                  <span className="text-[10px] text-muted-foreground">/ {kpi.target} {kpi.unit}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className={cn(
                    "h-full rounded-full",
                    kpi.status === "achieved" ? "bg-emerald-500" :
                    kpi.status === "on_track" ? "bg-blue-500" :
                    kpi.status === "at_risk" ? "bg-amber-500" : "bg-red-500",
                  )} style={{ width: `${Math.min(100, (kpi.value / kpi.target) * 100)}%` }} />
                </div>
                <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">{kpi.trend} trend</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsView({ state, onGenerate }: { state: SustainabilityState; onGenerate: () => void }) {
  return (
    <div className="space-y-3">
      <Card className="border-primary/10">
        <CardContent className="flex items-center justify-between p-3">
          <div>
            <h3 className="text-xs font-medium text-card-foreground">Executive Sustainability Report</h3>
            <p className="text-[10px] text-muted-foreground">Comprehensive report covering energy, water, waste, carbon, and ESG KPIs</p>
          </div>
          <Button variant="default" size="sm" className="h-7 text-[10px]" onClick={onGenerate}>
            <FileText className="mr-1 h-3 w-3" />
            Generate Report
          </Button>
        </CardContent>
      </Card>
      {state.lastReport && (
        <Card className="border-emerald-500/20">
          <CardContent className="p-4">
            <h3 className="mb-3 text-xs font-medium text-card-foreground">{state.lastReport.title}</h3>
            <p className="text-[10px] text-muted-foreground">Period: {state.lastReport.period}</p>
            <p className="text-[10px] text-muted-foreground">Generated: {new Date(state.lastReport.generatedAt).toLocaleString()}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <div className="rounded-md bg-amber-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Energy</p>
                <p className="text-sm font-bold text-amber-400 tabular-nums">{(state.lastReport.summary.totalEnergyKwh / 1000).toFixed(1)}k</p>
              </div>
              <div className="rounded-md bg-blue-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Water</p>
                <p className="text-sm font-bold text-blue-400 tabular-nums">{(state.lastReport.summary.totalWaterL / 1000).toFixed(0)}kL</p>
              </div>
              <div className="rounded-md bg-purple-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Waste</p>
                <p className="text-sm font-bold text-purple-400 tabular-nums">{state.lastReport.summary.wasteGeneratedKg}kg</p>
              </div>
              <div className="rounded-md bg-red-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Carbon</p>
                <p className="text-sm font-bold text-red-400 tabular-nums">{(state.lastReport.summary.totalCO2Kg / 1000).toFixed(1)}t</p>
              </div>
              <div className="rounded-md bg-emerald-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Score</p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">{state.lastReport.summary.sustainabilityScore}/100</p>
              </div>
            </div>
            <div className="mt-3">
              <h4 className="mb-1.5 text-[10px] font-medium text-muted-foreground">ESG Scorecard</h4>
              <div className="space-y-1">
                {state.lastReport.esgScorecard.filter((_, i) => i < 5).map((kpi) => (
                  <div key={kpi.metric} className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">{kpi.metric}</span>
                    <span className="font-medium tabular-nums">{kpi.value} / {kpi.target} {kpi.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <h4 className="mb-1.5 text-[10px] font-medium text-muted-foreground">Top Recommendations</h4>
              <div className="space-y-1">
                {state.lastReport.topRecommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                    <span>{rec.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <h4 className="mb-1.5 text-[10px] font-medium text-muted-foreground">Forecast</h4>
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-5">
                <div><span className="text-muted-foreground">Next Energy</span><p className="font-medium tabular-nums">{state.lastReport.forecast.nextMonthEnergy.toLocaleString()} kWh</p></div>
                <div><span className="text-muted-foreground">Next Water</span><p className="font-medium tabular-nums">{state.lastReport.forecast.nextMonthWater.toLocaleString()} L</p></div>
                <div><span className="text-muted-foreground">Next Waste</span><p className="font-medium tabular-nums">{state.lastReport.forecast.nextMonthWaste} kg</p></div>
                <div><span className="text-muted-foreground">Next Carbon</span><p className="font-medium tabular-nums">{state.lastReport.forecast.nextMonthCarbon.toLocaleString()} kg</p></div>
                <div><span className="text-muted-foreground">Net-Zero by</span><p className="font-medium tabular-nums">{state.lastReport.forecast.netZeroProjectedDate}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DomainView({ title, icon: Icon, color, bg, metrics, predictions }: {
  title: string;
  icon: import("@/types/common").IconType;
  color: string;
  bg: string;
  metrics: { label: string; value: string; sub: string; status: "healthy" | "warning" | "critical" }[];
  predictions: { type: string; assetName: string; probability: number; action: string; savings: number; carbon: number }[];
}) {
  const statusStyles = { healthy: "bg-emerald-500/10 text-emerald-400", warning: "bg-amber-500/10 text-amber-400", critical: "bg-red-500/10 text-red-400" };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-card-foreground">{m.label}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: m.status === "critical" ? "#f87171" : m.status === "warning" ? "#fbbf24" : undefined }}>{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px]", statusStyles[m.status])}>{m.status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {predictions.length > 0 && (
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">AI Predictions</h3>
            <div className="space-y-1.5">
              {predictions.map((p, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md bg-primary/5 px-2 py-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-card-foreground capitalize">{p.type}</span>
                      <span className="text-[10px] text-muted-foreground">— {p.assetName}</span>
                      <span className={cn("text-[10px] font-medium", p.probability >= 75 ? "text-red-400" : p.probability >= 50 ? "text-amber-400" : "text-emerald-400")}>
                        {p.probability}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{p.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

