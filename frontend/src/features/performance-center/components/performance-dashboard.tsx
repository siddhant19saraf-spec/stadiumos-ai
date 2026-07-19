"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Gauge, Activity, Clock, Zap, Database, BarChart3, RefreshCw } from "lucide-react";
import { performanceMonitor } from "@/services/performance-monitor";
import type { PerformanceSummary, HealthStatus } from "../types";
import { OverviewView } from "./perf-overview-view";
import { LatencyView } from "./perf-latency-view";
import { HealthView, formatUptime } from "./perf-health-view";
import { CacheView } from "./perf-cache-view";
import { WebVitalsView } from "./perf-web-vitals-view";
import { RecommendationsView } from "./perf-recommendations-view";
type Tab = "overview" | "latency" | "health" | "cache" | "webvitals" | "recommendations";

export function PerformanceDashboard() {
  const [summary, setSummary] = useState<PerformanceSummary>(() => performanceMonitor.computeSummary());
  const [health, setHealth] = useState<HealthStatus>(() => performanceMonitor.getHealthCheck());
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const refresh = useCallback(() => {
    setSummary(performanceMonitor.computeSummary());
    setHealth(performanceMonitor.getHealthCheck());
  }, []);

  const tabs = [
    { id: "overview" as Tab, label: "Performance Overview", icon: Gauge },
    { id: "latency" as Tab, label: "API Latency", icon: Clock },
    { id: "health" as Tab, label: "System Health", icon: Activity },
    { id: "cache" as Tab, label: "Cache Analytics", icon: Database },
    { id: "webvitals" as Tab, label: "Web Vitals", icon: BarChart3 },
    { id: "recommendations" as Tab, label: "Recommendations", icon: Zap },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Gauge className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-card-foreground">Performance Center</h1>
              <Badge variant="outline" className={cn("text-[10px]", health.status === "healthy" ? "text-emerald-400 border-emerald-500/20" : health.status === "degraded" ? "text-amber-400 border-amber-500/20" : "text-red-400 border-red-500/20")}>
                {health.status}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Uptime: {formatUptime(health.uptimeSeconds)} &middot; {summary.totalRequests} requests tracked &middot; {summary.errorRate}% error rate
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={refresh}>
          <RefreshCw className="mr-1 h-3 w-3" />
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

      {activeTab === "overview" && <OverviewView summary={summary} health={health} />}
      {activeTab === "latency" && <LatencyView summary={summary} />}
      {activeTab === "health" && <HealthView health={health} />}
      {activeTab === "cache" && <CacheView />}
      {activeTab === "webvitals" && <WebVitalsView summary={summary} />}
      {activeTab === "recommendations" && <RecommendationsView summary={summary} health={health} />}
    </div>
  );
}

