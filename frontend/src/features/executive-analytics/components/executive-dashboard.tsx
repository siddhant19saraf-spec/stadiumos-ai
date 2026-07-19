"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Lightbulb, AlertTriangle, Clock, FileText, UserCheck,
  Brain, RefreshCw,
} from "lucide-react";
import { executiveService, createState } from "../services/executive-service";
import { copilotEngine } from "../services/copilot-engine";
import { analyticsEngine } from "../services/analytics-engine";
import type { ExecutiveAnalyticsData, ExecutiveRole, CopilotQueryResult } from "../types";
import { EXECUTIVE_ROLES } from "../constants";
import { OverviewView } from "./executive-overview-view";
import { DecisionsView } from "./executive-decisions-view";
import { AlertsView } from "./executive-alerts-view";
import { TimelineView } from "./executive-timeline-view";
import { ReportsView } from "./executive-reports-view";
import { CopilotView } from "./copilot-view";

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

      <div className="flex flex-wrap gap-1">
        {([{ id: "overview", label: "Command Center", icon: LayoutDashboard },
          { id: "decisions", label: "Decisions", icon: Lightbulb },
          { id: "alerts", label: "Alerts", icon: AlertTriangle },
          { id: "timeline", label: "Timeline", icon: Clock },
          { id: "reports", label: "Reports", icon: FileText },
          { id: "copilot", label: "AI Copilot", icon: Brain },
        ] as { id: Tab; label: string; icon: typeof LayoutDashboard }[]).map((tab) => (
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

      {activeTab === "overview" && (
        <OverviewView state={state} summary={summary} healthSummary={healthSummary} onImplement={handleImplement} />
      )}

      {activeTab === "decisions" && <DecisionsView state={state} onImplement={handleImplement} />}
      {activeTab === "alerts" && <AlertsView state={state} onAcknowledge={handleAckAlert} />}
      {activeTab === "timeline" && <TimelineView state={state} />}
      {activeTab === "reports" && <ReportsView state={state} onGenerate={handleGenerateReport} />}
      {activeTab === "copilot" && (
        <CopilotView state={state} input={copilotInput} onInputChange={setCopilotInput} onSubmit={handleCopilotQuery} result={copilotResult} suggestedQuestions={suggestedQuestions} />
      )}
    </div>
  );
}
