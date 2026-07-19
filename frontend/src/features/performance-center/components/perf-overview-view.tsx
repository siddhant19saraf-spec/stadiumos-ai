"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Server, Cpu, Database, XCircle, HardDrive, Activity, AlertTriangle } from "lucide-react";
import { PerfKpiCard } from "./perf-kpi-card";
import type { PerformanceSummary, HealthStatus } from "../types";

export function OverviewView({ summary, health }: { summary: PerformanceSummary; health: HealthStatus }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        <PerfKpiCard label="Avg API Latency" value={summary.avgApiLatencyMs} unit="ms" icon={Clock}
          status={summary.avgApiLatencyMs < 200 ? "healthy" : summary.avgApiLatencyMs < 500 ? "warning" : "critical"} />
        <PerfKpiCard label="Avg Page Load" value={summary.avgPageLoadMs} unit="ms" icon={Server}
          status={summary.avgPageLoadMs < 1500 ? "healthy" : summary.avgPageLoadMs < 3000 ? "warning" : "critical"} />
        <PerfKpiCard label="AI Response" value={summary.avgAiResponseMs} unit="ms" icon={Cpu}
          status={summary.avgAiResponseMs < 1500 ? "healthy" : summary.avgAiResponseMs < 3000 ? "warning" : "critical"} />
        <PerfKpiCard label="Cache Hit Rate" value={summary.cacheHitRate} unit="%" icon={Database}
          status={summary.cacheHitRate > 70 ? "healthy" : summary.cacheHitRate > 40 ? "warning" : "critical"} />
        <PerfKpiCard label="Error Rate" value={summary.errorRate} unit="%" icon={XCircle}
          status={summary.errorRate < 5 ? "healthy" : summary.errorRate < 15 ? "warning" : "critical"} />
        <PerfKpiCard label="Memory" value={summary.memoryUsageMb} unit="MB" icon={HardDrive}
          status={summary.memoryUsageMb < 300 ? "healthy" : summary.memoryUsageMb < 500 ? "warning" : "critical"} />
        <PerfKpiCard label="System Health" value={health.status} icon={Activity}
          status={health.status === "healthy" ? "healthy" : health.status === "degraded" ? "warning" : "critical"} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Latency Percentiles</h3>
            <div className="space-y-2">
              {[
                { label: "P50", value: summary.p50LatencyMs, color: "text-emerald-400" },
                { label: "P95", value: summary.p95LatencyMs, color: "text-amber-400" },
                { label: "P99", value: summary.p99LatencyMs, color: "text-red-400" },
              ].map((p) => (
                <div key={p.label} className="flex items-center justify-between rounded-md bg-primary/5 px-2 py-1.5">
                  <span className="text-[10px] text-muted-foreground">{p.label}</span>
                  <span className={cn("text-xs font-bold tabular-nums", p.color)}>{p.value}ms</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">System Checks</h3>
            <div className="space-y-1">
              {Object.entries(health.checks).map(([key, check]) => (
                <div key={key} className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1.5">
                  <div className={cn("h-2 w-2 shrink-0 rounded-full", check.status === "healthy" ? "bg-emerald-500" : check.status === "degraded" ? "bg-amber-500" : "bg-red-500")} />
                  <span className="flex-1 text-[10px] capitalize text-card-foreground">{key}</span>
                  <Badge variant="outline" className={cn("text-[8px]", check.status === "healthy" ? "text-emerald-400" : check.status === "degraded" ? "text-amber-400" : "text-red-400")}>{check.status}</Badge>
                  {check.latencyMs > 0 && <span className="text-[10px] text-muted-foreground tabular-nums">{check.latencyMs}{key === "memory" ? "MB" : key === "errors" ? "%" : "ms"}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Slow Endpoints</h3>
            <div className="space-y-1">
              {summary.slowEndpoints.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">No slow endpoints detected</p>
              ) : (
                summary.slowEndpoints.map((ep: { path: string; avgMs: number; count: number }) => (
                  <div key={ep.path} className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1.5">
                    <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />
                    <span className="flex-1 text-[10px] text-card-foreground">{ep.path}</span>
                    <span className="text-[10px] font-medium tabular-nums text-red-400">{ep.avgMs}ms</span>
                    <span className="text-[9px] text-muted-foreground">({ep.count}x)</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
