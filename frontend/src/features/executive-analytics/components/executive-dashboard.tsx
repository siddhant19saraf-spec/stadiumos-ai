"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Lightbulb, AlertTriangle, Clock, FileText, UserCheck,
  Brain, Send, TrendingUp, Shield, Users, Calendar, Siren, Building2, Car,
  Zap, Leaf, Heart, RefreshCw, CheckCircle2, X, ChevronRight, AlertCircle,
  BarChart3, Target, Award, Menu,
} from "lucide-react";
import { executiveService, createState } from "../services/executive-service";
import { copilotEngine } from "../services/copilot-engine";
import { riskEngine } from "../services/risk-engine";
import { analyticsEngine } from "../services/analytics-engine";
import { reportingEngine } from "../services/reporting-engine";
import type { ExecutiveAnalyticsData, ExecutiveRole, CopilotQueryResult, TimelineEvent } from "../types";
import { EXECUTIVE_ROLES, KPI_CATEGORY_LABELS } from "../constants";

type Tab = "overview" | "decisions" | "alerts" | "timeline" | "reports" | "copilot";

export function ExecutiveDashboard() {
  const [state, setState] = useState<ExecutiveAnalyticsData>(createState());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [roleSelectorOpen, setRoleSelectorOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotResult, setCopilotResult] = useState<CopilotQueryResult | null>(null);

  const init = useCallback((role?: ExecutiveRole) => {
    setLoading(true);
    setState(executiveService.initialize(role));
    setLoading(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  const refresh = useCallback(() => {
    setLoading(true);
    setState((prev) => executiveService.refresh(prev));
    setLoading(false);
  }, []);

  const switchRole = useCallback((role: ExecutiveRole) => {
    init(role);
    setRoleSelectorOpen(false);
  }, [init]);

  const handleImplement = useCallback((decisionId: string) => {
    setState((prev) => executiveService.implementDecision(prev, decisionId, state.selectedRole));
  }, [state.selectedRole]);

  const handleAckAlert = useCallback((alertId: string) => {
    setState((prev) => executiveService.acknowledgeAlert(prev, alertId));
  }, []);

  const handleGenerateReport = useCallback(() => {
    setState((prev) => executiveService.generateReport(prev));
    setActiveTab("reports");
  }, []);

  const handleCopilotQuery = useCallback(() => {
    if (!copilotInput.trim()) return;
    const { state: newState, result } = executiveService.queryCopilot(state, copilotInput);
    setState(newState);
    setCopilotResult(result);
    setCopilotInput("");
    setActiveTab("copilot");
  }, [copilotInput, state]);

  const suggestedQuestions = copilotEngine.getSuggestedQuestions();

  if (loading && !state.summary) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-muted-foreground">
        Initializing Executive Command Center...
      </div>
    );
  }

  const summary = state.summary;
  const currentRole = EXECUTIVE_ROLES.find((r) => r.role === state.selectedRole);
  const unackedAlerts = state.alerts.filter((a) => !a.acknowledged).length;
  const criticalAlerts = state.alerts.filter((a) => !a.acknowledged && a.severity === "critical").length;
  const healthSummary = analyticsEngine.computeHealthSummary(state.kpis);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <LayoutDashboard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-card-foreground">Executive Command Center</h1>
              {summary.matchDayStatus === "active" && (
                <Badge variant="outline" className="bg-emerald-500/10 text-[10px] text-emerald-400">
                  Match Day Active
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              AI-powered decision intelligence platform &middot; {currentRole?.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px]"
              onClick={() => setRoleSelectorOpen(!roleSelectorOpen)}
            >
              <UserCheck className="mr-1 h-3 w-3" />
              {currentRole?.label.split(" ").slice(0, 2).join(" ")}
            </Button>
            {roleSelectorOpen && (
              <Card className="absolute right-0 top-full z-50 mt-1 w-56 border-primary/10">
                <CardContent className="p-2">
                  {EXECUTIVE_ROLES.map((r) => (
                    <Button
                      key={r.role}
                      variant={state.selectedRole === r.role ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-full justify-start text-[10px]"
                      onClick={() => switchRole(r.role)}
                    >
                      {r.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleGenerateReport}>
            <FileText className="mr-1 h-3 w-3" />
            Board Report
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn("mr-1 h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1">
        {([{ id: "overview", label: "Command Center", icon: LayoutDashboard },
          { id: "decisions", label: "Decisions", icon: Lightbulb },
          { id: "alerts", label: "Alerts", icon: AlertTriangle },
          { id: "timeline", label: "Timeline", icon: Clock },
          { id: "reports", label: "Reports", icon: FileText },
          { id: "copilot", label: "AI Copilot", icon: Brain },
        ] as { id: Tab; label: string; icon: import("@/types/common").IconType }[]).map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            className={cn("h-7 text-[10px] relative", activeTab !== tab.id && "text-muted-foreground")}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="mr-1 h-3 w-3" />
            {tab.label}
            {tab.id === "alerts" && unackedAlerts > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                {unackedAlerts}
              </span>
            )}
            {tab.id === "decisions" && state.decisions.filter((d) => d.status === "active").length > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white">
                {state.decisions.filter((d) => d.status === "active").length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Critical Alert Bar */}
      {criticalAlerts > 0 && (
        <Card className="border-red-500/20 bg-red-500/[0.03]">
          <CardContent className="flex items-center gap-2 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span className="text-[10px] text-red-400">
              {criticalAlerts} critical alert{criticalAlerts > 1 ? "s" : ""} require{criticalAlerts === 1 ? "s" : ""} immediate executive attention
            </span>
            <Button variant="ghost" size="sm" className="ml-auto h-6 text-[10px]" onClick={() => setActiveTab("alerts")}>
              View Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <OverviewView
          state={state}
          summary={summary}
          healthSummary={healthSummary}
          onImplement={handleImplement}
          onAckAlert={handleAckAlert}
        />
      )}

      {activeTab === "decisions" && <DecisionsView state={state} onImplement={handleImplement} />}
      {activeTab === "alerts" && <AlertsView state={state} onAcknowledge={handleAckAlert} />}
      {activeTab === "timeline" && <TimelineView state={state} />}
      {activeTab === "reports" && <ReportsView state={state} onGenerate={handleGenerateReport} />}
      {activeTab === "copilot" && (
        <CopilotView
          state={state}
          input={copilotInput}
          onInputChange={setCopilotInput}
          onSubmit={handleCopilotQuery}
          result={copilotResult}
          suggestedQuestions={suggestedQuestions}
        />
      )}
    </div>
  );
}

/* ============= Overview View ============= */
function OverviewView({ state, summary, healthSummary, onImplement, onAckAlert }: {
  state: ExecutiveAnalyticsData; summary: typeof state.summary;
  healthSummary: ReturnType<typeof analyticsEngine.computeHealthSummary>;
  onImplement: (id: string) => void; onAckAlert: (id: string) => void;
}) {
  const overallRisk = riskEngine.getOverallRisk(summary);
  const financialProj = analyticsEngine.getFinancialProjection();
  const kpiScores = analyticsEngine.aggregateKpis(summary, state.kpis);

  return (
    <div className="space-y-3">
      {/* Executive KPI Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        <ExecutiveKpiCard label="Operational Health" value={`${summary.operationalHealthScore}%`} status={summary.operationalHealthScore >= 60 ? "healthy" : "warning"} icon={BarChart3} />
        <ExecutiveKpiCard label="Safety Score" value={`${summary.safetyScore}%`} status={summary.safetyScore >= 70 ? "healthy" : "warning"} icon={Shield} />
        <ExecutiveKpiCard label="Crowd Health" value={`${summary.crowdHealthScore}%`} status={summary.crowdHealthScore >= 65 ? "healthy" : "warning"} icon={Users} />
        <ExecutiveKpiCard label="Infrastructure" value={`${summary.infrastructureHealth}%`} status={summary.infrastructureHealth >= 55 ? "healthy" : "critical"} icon={Building2} />
        <ExecutiveKpiCard label="Energy Efficiency" value={`${summary.energyEfficiency}%`} status={summary.energyEfficiency >= 65 ? "healthy" : "warning"} icon={Zap} />
        <ExecutiveKpiCard label="Visitor Satisfaction" value={`${summary.visitorSatisfaction}%`} status={summary.visitorSatisfaction >= 70 ? "healthy" : "warning"} icon={Heart} />
        <ExecutiveKpiCard label="Risk Score" value={`${summary.executiveRiskScore}%`} status={summary.executiveRiskScore <= 40 ? "healthy" : "critical"} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {/* KPI Categories */}
        <Card className="border-primary/10 xl:col-span-2">
          <CardContent className="p-4">
            <h3 className="mb-3 text-xs font-medium text-card-foreground">KPI Categories</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {kpiScores.map((cat) => (
                <div key={cat.category} className="rounded-md bg-primary/5 p-2">
                  <p className="text-[10px] text-muted-foreground capitalize">{cat.category.replace(/_/g, " ")}</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: cat.score >= 70 ? "#34d399" : cat.score >= 50 ? "#fbbf24" : "#f87171" }}>{cat.score}</p>
                  <p className={cn("text-[10px]", cat.trend === "improving" ? "text-emerald-400" : cat.trend === "declining" ? "text-red-400" : "text-muted-foreground")}>{cat.trend}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health Summary + Risk */}
        <div className="space-y-3">
          <Card className="border-primary/10">
            <CardContent className="p-3">
              <h3 className="mb-2 text-xs font-medium text-card-foreground">System Health</h3>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400">Healthy</span>
                  <span className="font-medium tabular-nums">{healthSummary.healthy}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-amber-400">Warning</span>
                  <span className="font-medium tabular-nums">{healthSummary.warning}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-red-400">Critical</span>
                  <span className="font-medium tabular-nums">{healthSummary.critical}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="p-3">
              <h3 className="mb-2 text-xs font-medium text-card-foreground">Risk Overview</h3>
              <p className="text-lg font-bold tabular-nums" style={{ color: overallRisk.score >= 40 ? "#f87171" : "#34d399" }}>{overallRisk.score}</p>
              <p className="text-[10px] capitalize text-muted-foreground">{overallRisk.level} risk &middot; {overallRisk.trend}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Decisions */}
      {state.decisions.filter((d) => d.status === "active").length > 0 && (
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">
              Active AI Decisions ({state.decisions.filter((d) => d.status === "active").length})
            </h3>
            <div className="space-y-1.5">
              {state.decisions.filter((d) => d.status === "active").slice(0, 4).map((dec) => (
                <div key={dec.id} className="flex items-start gap-2 rounded-md bg-primary/5 px-2 py-1.5">
                  <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-card-foreground">{dec.title}</span>
                      <Badge variant="outline" className={cn("text-[8px]", dec.priority === "p0" ? "text-red-400 border-red-500/20" : dec.priority === "p1" ? "text-orange-400 border-orange-500/20" : "text-muted-foreground")}>
                        {dec.priority}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{dec.confidence}% confidence</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{dec.description.substring(0, 100)}</p>
                  </div>
                  {dec.requiresAuthorization ? (
                    <Button variant="outline" size="sm" className="h-6 shrink-0 text-[10px] border-amber-500/30" onClick={() => onImplement(dec.id)}>
                      Authorize
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-6 shrink-0 text-[10px]" onClick={() => onImplement(dec.id)}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Implement
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module Snapshots */}
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Module Status</h3>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-6">
            {state.moduleSnapshots.map((mod) => (
              <div key={mod.moduleId} className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", mod.status === "healthy" ? "bg-emerald-500" : mod.status === "warning" ? "bg-amber-500" : "bg-red-500")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] text-card-foreground">{mod.moduleName}</p>
                  <p className="text-[10px] text-muted-foreground">{mod.healthScore}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============= Decisions View ============= */
function DecisionsView({ state, onImplement }: { state: ExecutiveAnalyticsData; onImplement: (id: string) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? state.decisions : state.decisions.filter((d) => d.status === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        <Button variant={filter === "active" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("active")}>Active</Button>
        <Button variant={filter === "implemented" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("implemented")}>Implemented</Button>
        <Button variant={filter === "in_review" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("in_review")}>In Review</Button>
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No decisions match filter
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((dec) => (
            <Card key={dec.id} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-sm font-medium text-card-foreground">{dec.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", dec.priority === "p0" ? "text-red-400 border-red-500/20" : dec.priority === "p1" ? "text-orange-400 border-orange-500/20" : "text-muted-foreground")}>
                        {dec.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{dec.status.replace(/_/g, " ")}</Badge>
                      <span className="text-[10px] text-muted-foreground">{dec.confidence}% confidence</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{dec.description}</p>
                  </div>
                  {dec.status === "active" && (
                    <Button variant={dec.requiresAuthorization ? "outline" : "ghost"} size="sm" className={cn("h-7 shrink-0 text-[10px]", dec.requiresAuthorization && "border-amber-500/30")} onClick={() => onImplement(dec.id)}>
                      {dec.requiresAuthorization ? "Authorize" : "Implement"}
                    </Button>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
                  <div className="rounded-md bg-blue-500/5 p-1.5">
                    <p className="text-muted-foreground">Cost Impact</p>
                    <p className="font-medium tabular-nums">${dec.estimatedCostImpact.toLocaleString()}</p>
                  </div>
                  <div className="rounded-md bg-purple-500/5 p-1.5">
                    <p className="text-muted-foreground">Time Impact</p>
                    <p className="font-medium tabular-nums">{dec.estimatedTimeImpact}</p>
                  </div>
                  <div className="rounded-md bg-primary/5 p-1.5">
                    <p className="text-muted-foreground">Module</p>
                    <p className="font-medium tabular-nums capitalize">{dec.sourceModule.replace(/-/g, " ")}</p>
                  </div>
                  <div className="rounded-md bg-amber-500/5 p-1.5">
                    <p className="text-muted-foreground">Authorization</p>
                    <p className="font-medium tabular-nums">{dec.requiresAuthorization ? "Required" : "Not Required"}</p>
                  </div>
                </div>
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                    AI Reasoning & Evidence
                  </summary>
                  <div className="mt-1 space-y-1 pl-2">
                    <p className="text-[10px] font-medium text-muted-foreground">Reasoning:</p>
                    {dec.reasoning.map((r, i) => (<p key={i} className="text-[10px] text-muted-foreground">• {r}</p>))}
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">Supporting Evidence:</p>
                    {dec.supportingEvidence.map((e, i) => (<p key={i} className="text-[10px] text-muted-foreground">• {e}</p>))}
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">Business Impact:</p>
                    <p className="text-[10px] text-muted-foreground">{dec.businessImpact}</p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">Operational Impact:</p>
                    <p className="text-[10px] text-muted-foreground">{dec.operationalImpact}</p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">Risk Assessment:</p>
                    <p className="text-[10px] text-muted-foreground">{dec.riskAssessment}</p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">Alternative Options:</p>
                    {dec.alternativeOptions.map((a, i) => (<p key={i} className="text-[10px] text-muted-foreground">• {a}</p>))}
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

/* ============= Alerts View ============= */
function AlertsView({ state, onAcknowledge }: { state: ExecutiveAnalyticsData; onAcknowledge: (id: string) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? state.alerts :
    filter === "unacked" ? state.alerts.filter((a) => !a.acknowledged) :
    state.alerts.filter((a) => a.severity === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        <Button variant={filter === "unacked" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("unacked")}>Unacknowledged</Button>
        <Button variant={filter === "critical" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("critical")}>Critical</Button>
        <Button variant={filter === "severe" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("severe")}>Severe</Button>
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No alerts match filter
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => (
            <Card key={alert.id} className={cn(
              "border-l-4 border-primary/10",
              alert.severity === "critical" ? "border-l-red-500" : alert.severity === "severe" ? "border-l-orange-500" :
              alert.severity === "high" ? "border-l-amber-500" : "border-l-blue-500",
              alert.acknowledged && "opacity-50",
            )}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("h-3.5 w-3.5", alert.severity === "critical" || alert.severity === "severe" ? "text-red-400" : "text-amber-400")} />
                      <span className="text-sm font-medium text-card-foreground">{alert.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", alert.severity === "critical" ? "text-red-400 border-red-500/20" : alert.severity === "severe" ? "text-orange-400" : alert.severity === "high" ? "text-amber-400" : "text-muted-foreground")}>{alert.severity}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{alert.category.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{alert.escalationLevel}</Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{alert.message}</p>
                  </div>
                  {!alert.acknowledged && (
                    <Button variant="ghost" size="sm" className="h-7 shrink-0 text-[10px]" onClick={() => onAcknowledge(alert.id)}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Acknowledge
                    </Button>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>Source: {alert.sourceModule}</span>
                  <span>Modules: {alert.involvesModules.join(", ")}</span>
                  {alert.requiresExecutiveAction && <Badge variant="outline" className="text-[8px] text-red-400 border-red-500/20">Executive Action Required</Badge>}
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

/* ============= Timeline View ============= */
function TimelineView({ state }: { state: ExecutiveAnalyticsData }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? state.timeline : state.timeline.filter((e) => e.type === filter);

  const severityStyles: Record<string, string> = {
    positive: "border-l-emerald-500", info: "border-l-blue-500",
    warning: "border-l-amber-500", critical: "border-l-red-500",
  };
  const severityIcons: Record<string, any> = {
    positive: CheckCircle2, info: Clock, warning: AlertTriangle, critical: AlertCircle,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        {["incident", "operation", "maintenance", "ai_recommendation", "executive_decision", "milestone"].map((t) => (
          <Button key={t} variant={filter === t ? "default" : "ghost"} size="sm" className="h-7 text-[10px] capitalize" onClick={() => setFilter(t)}>
            {t.replace(/_/g, " ")}
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No timeline events match filter
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((event) => {
            const Icon = severityIcons[event.severity] ?? Clock;
            return (
              <div key={event.id} className={cn("flex items-start gap-3 rounded-md border-l-4 border-primary/10 bg-gradient-to-br from-background to-primary/[0.02] p-3", severityStyles[event.severity] ?? "border-l-primary/10")}>
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", event.severity === "critical" ? "text-red-400" : event.severity === "warning" ? "text-amber-400" : event.severity === "positive" ? "text-emerald-400" : "text-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-card-foreground">{event.title}</span>
                    <Badge variant="outline" className="text-[8px] capitalize text-muted-foreground">{event.type.replace(/_/g, " ")}</Badge>
                    <Badge variant="outline" className="text-[8px] text-muted-foreground">{event.module}</Badge>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{event.description}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============= Reports View ============= */
function ReportsView({ state, onGenerate }: { state: ExecutiveAnalyticsData; onGenerate: () => void }) {
  const history = reportingEngine.getReportHistory();

  return (
    <div className="space-y-3">
      <Card className="border-primary/10">
        <CardContent className="flex items-center justify-between p-3">
          <div>
            <h3 className="text-xs font-medium text-card-foreground">Board Report</h3>
            <p className="text-[10px] text-muted-foreground">Generate an executive board report with KPIs, risks, recommendations, and forecasts</p>
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
            <div className="mt-3 rounded-md bg-primary/5 p-2">
              <p className="text-[10px] font-medium text-muted-foreground">Executive Summary</p>
              <p className="mt-0.5 text-[10px] text-card-foreground">{state.lastReport.executiveSummary}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <div className="rounded-md bg-amber-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Op Health</p>
                <p className="text-sm font-bold text-amber-400 tabular-nums">{state.lastReport.summary.operationalHealthScore}%</p>
              </div>
              <div className="rounded-md bg-emerald-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Safety</p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">{state.lastReport.summary.safetyScore}%</p>
              </div>
              <div className="rounded-md bg-red-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Risk</p>
                <p className="text-sm font-bold text-red-400 tabular-nums">{state.lastReport.summary.executiveRiskScore}%</p>
              </div>
              <div className="rounded-md bg-blue-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Infrastructure</p>
                <p className="text-sm font-bold text-blue-400 tabular-nums">{state.lastReport.summary.infrastructureHealth}%</p>
              </div>
              <div className="rounded-md bg-purple-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Sustainability</p>
                <p className="text-sm font-bold text-purple-400 tabular-nums">{state.lastReport.summary.carbonScore}%</p>
              </div>
            </div>
            <div className="mt-3">
              <h4 className="mb-1 text-[10px] font-medium text-muted-foreground">Strategic Roadmap</h4>
              <p className="text-[10px] text-card-foreground whitespace-pre-line">{state.lastReport.strategicRoadmap}</p>
            </div>
            <div className="mt-3">
              <h4 className="mb-1 text-[10px] font-medium text-muted-foreground">Forecast</h4>
              <p className="text-[10px] text-card-foreground">{state.lastReport.forecastSummary}</p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Report History</h3>
          <div className="space-y-1">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-md bg-primary/5 px-2 py-1.5">
                <div>
                  <p className="text-[10px] text-card-foreground">{h.title}</p>
                  <p className="text-[10px] text-muted-foreground">{h.period}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                  <FileText className="mr-1 h-3 w-3" />
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============= Copilot View ============= */
function CopilotView({ state, input, onInputChange, onSubmit, result, suggestedQuestions }: {
  state: ExecutiveAnalyticsData; input: string; onInputChange: (v: string) => void;
  onSubmit: () => void; result: CopilotQueryResult | null;
  suggestedQuestions: string[];
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.copilotHistory]);

  return (
    <div className="space-y-3">
      <Card className="border-primary/10">
        <CardContent className="p-4">
          <div className="mb-3 flex h-[400px] flex-col overflow-y-auto space-y-3">
            {state.copilotHistory.length === 0 && (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <Brain className="mx-auto h-8 w-8 text-primary/30" />
                  <p className="mt-2 text-xs text-muted-foreground">Ask the Executive AI Advisor about stadium operations</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {suggestedQuestions.map((q, i) => (
                      <Button key={i} variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => { onInputChange(q); }}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {state.copilotHistory.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-md px-3 py-2",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}>
                  <p className="text-[10px] whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" && msg.confidence && (
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>Confidence: {msg.confidence}%</span>
                      {msg.sources && <span>Sources: {msg.sources.join(", ")}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center gap-2 border-t pt-3">
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Ask about stadium operations, risks, decisions..."
              className="h-8 text-[10px]"
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
            <Button size="sm" className="h-8 shrink-0" onClick={onSubmit}>
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">AI Analysis Results</h3>
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center gap-2">
                <Brain className="h-3 w-3 text-primary" />
                <span>Confidence: {result.confidence}%</span>
                <span className="text-muted-foreground">Sources: {result.sources.join(", ")}</span>
              </div>
              {result.dataPoints.length > 0 && (
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {result.dataPoints.map((dp, i) => (
                    <div key={i} className="rounded-md bg-primary/5 p-1.5">
                      <p className="text-muted-foreground">{dp.label}</p>
                      <p className="font-medium tabular-nums">{dp.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {result.riskFlags.length > 0 && (
                <div className="rounded-md bg-red-500/5 p-1.5">
                  <p className="font-medium text-red-400">Risk Flags</p>
                  {result.riskFlags.map((f, i) => (<p key={i}>• {f}</p>))}
                </div>
              )}
              {result.recommendations.length > 0 && (
                <div className="rounded-md bg-amber-500/5 p-1.5">
                  <p className="font-medium text-amber-400">Recommendations</p>
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span>{r.title}</span>
                      <span className="text-muted-foreground">({r.confidence}% confidence)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ============= Executive KPI Card ============= */
function ExecutiveKpiCard({ label, value, status, icon: Icon }: { label: string; value: string; status: string; icon: import("@/types/common").IconType }) {
  const colorMap: Record<string, string> = {
    healthy: "text-emerald-400 bg-emerald-500/10",
    warning: "text-amber-400 bg-amber-500/10",
    critical: "text-red-400 bg-red-500/10",
    neutral: "text-muted-foreground bg-primary/5",
  };
  return (
    <Card className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
      <CardContent className="flex items-start gap-2 p-2.5">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", colorMap[status] ?? colorMap.neutral)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] text-muted-foreground">{label}</p>
          <p className={cn("text-sm font-bold tabular-nums", status === "healthy" ? "text-emerald-400" : status === "warning" ? "text-amber-400" : status === "critical" ? "text-red-400" : "")}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
