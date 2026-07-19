"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, Shield, Users, Building2, Zap, Heart, AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";
import { ExecutiveKpiCard } from "./executive-kpi-card";
import type { ExecutiveAnalyticsData } from "../types";
import { riskEngine } from "../services/risk-engine";
import { analyticsEngine } from "../services/analytics-engine";

export function OverviewView({ state, summary, healthSummary, onImplement }: {
  state: ExecutiveAnalyticsData;
  summary: ExecutiveAnalyticsData["summary"];
  healthSummary: { healthy: number; warning: number; critical: number };
  onImplement: (id: string) => void;
}) {
  const overallRisk = riskEngine.getOverallRisk(summary);
  const kpiScores = analyticsEngine.aggregateKpis(summary, state.kpis);

  return (
    <div className="space-y-3">
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
        <Card className="border-primary/10 xl:col-span-2">
          <CardContent className="p-4">
            <h3 className="mb-3 text-xs font-medium text-card-foreground">KPI Categories</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {kpiScores.map((cat: { category: string; score: number; trend: string }) => (
                <div key={cat.category} className="rounded-md bg-primary/5 p-2">
                  <p className="text-[10px] text-muted-foreground capitalize">{cat.category.replace(/_/g, " ")}</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: cat.score >= 70 ? "#34d399" : cat.score >= 50 ? "#fbbf24" : "#f87171" }}>{cat.score}</p>
                  <p className={cn("text-[10px]", cat.trend === "improving" ? "text-emerald-400" : cat.trend === "declining" ? "text-red-400" : "text-muted-foreground")}>{cat.trend}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
