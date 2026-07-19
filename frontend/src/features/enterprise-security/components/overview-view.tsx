"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShieldCheck, Users, UserX, AlertTriangle, AlertCircle, UserCheck, Clock } from "lucide-react";
import { SecurityKpiCard } from "./security-kpi-card";
import type { EnterpriseSecurityData } from "../types";
import { complianceEngine } from "../services/compliance-engine";
import { securityAnalyticsEngine } from "../services/security-analytics-engine";

export function OverviewView({ state, analytics }: { state: EnterpriseSecurityData; analytics: EnterpriseSecurityData["analytics"] }) {
  const frameworkScores = complianceEngine.getFrameworkScores();
  const riskHeatmap = securityAnalyticsEngine.getRiskHeatmap();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        <SecurityKpiCard label="Security Score" value={`${analytics.overallSecurityScore}%`} icon={ShieldCheck} status={analytics.overallSecurityScore >= 70 ? "healthy" : analytics.overallSecurityScore >= 50 ? "warning" : "critical"} subtitle={analytics.uptimePercentage + "% uptime"} />
        <SecurityKpiCard label="Active Users" value={String(analytics.totalUsers)} icon={Users} status="healthy" subtitle={`${state.sessions.filter((s) => s.isActive).length} online`} />
        <SecurityKpiCard label="Failed Logins (24h)" value={String(analytics.failedLogins24h)} icon={UserX} status={analytics.failedLogins24h > 10 ? "critical" : analytics.failedLogins24h > 3 ? "warning" : "healthy"} />
        <SecurityKpiCard label="Suspicious Activity" value={String(analytics.suspiciousActivities24h)} icon={AlertTriangle} status={analytics.suspiciousActivities24h > 2 ? "critical" : analytics.suspiciousActivities24h > 0 ? "warning" : "healthy"} />
        <SecurityKpiCard label="Critical Alerts" value={String(analytics.criticalAlerts)} icon={AlertCircle} status={analytics.criticalAlerts > 0 ? "critical" : "healthy"} />
        <SecurityKpiCard label="Login Success Rate" value={`${analytics.loginSuccessRate}%`} icon={UserCheck} status={analytics.loginSuccessRate >= 90 ? "healthy" : analytics.loginSuccessRate >= 75 ? "warning" : "critical"} />
        <SecurityKpiCard label="Avg Response Time" value={`${analytics.avgResponseTimeMin}m`} icon={Clock} status={analytics.avgResponseTimeMin <= 15 ? "healthy" : analytics.avgResponseTimeMin <= 30 ? "warning" : "critical"} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card className="border-primary/10 xl:col-span-2">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Compliance Readiness</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {frameworkScores.map((fw: { framework: string; label: string; score: number; status: string }) => (
                <div key={fw.framework} className="rounded-md bg-primary/5 p-2">
                  <p className="text-[10px] text-muted-foreground">{fw.label}</p>
                  <p className={cn("text-lg font-bold tabular-nums", fw.score >= 80 ? "text-emerald-400" : fw.score >= 60 ? "text-amber-400" : "text-red-400")}>{fw.score}%</p>
                  <Badge variant="outline" className={cn("mt-1 text-[8px]", fw.status === "compliant" ? "text-emerald-400 border-emerald-500/20" : fw.status === "partial" ? "text-amber-400 border-amber-500/20" : "text-red-400 border-red-500/20")}>{fw.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Risk Heatmap</h3>
            <div className="space-y-1">
              {riskHeatmap.map((item: { zone: string; risk: number; label: string }) => (
                <div key={item.zone} className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1">
                  <div className={cn("h-2 w-2 shrink-0 rounded-full", item.risk >= 70 ? "bg-red-500" : item.risk >= 40 ? "bg-amber-500" : "bg-emerald-500")} />
                  <span className="flex-1 text-[10px] text-card-foreground">{item.zone}</span>
                  <span className={cn("text-[10px] font-medium", item.risk >= 70 ? "text-red-400" : item.risk >= 40 ? "text-amber-400" : "text-emerald-400")}>{item.risk}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">7-Day Threat Trends</h3>
          <div className="flex items-end gap-1 sm:gap-2">
            {analytics.threatTrends.filter((t) => t.type === "failed").map((trend) => {
              const maxCount = Math.max(...analytics.threatTrends.map((t) => t.count), 1);
              const heightPct = Math.max(8, (trend.count / maxCount) * 100);
              return (
                <div key={trend.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[8px] text-muted-foreground">{trend.count}</span>
                  <div className="flex w-full flex-col gap-0.5">
                    <div className="w-full rounded-t bg-red-500/40" style={{ height: `${heightPct * 0.6}px` }} />
                  </div>
                  <span className="text-[7px] text-muted-foreground">{trend.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
