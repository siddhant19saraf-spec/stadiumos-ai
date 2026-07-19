"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Gauge, Activity, Clock, Cpu, Zap, Database, Wifi,
  TrendingUp, TrendingDown, RefreshCw, AlertTriangle,
  BarChart3, Server, HardDrive, FileText, Shield,
  ChevronRight, CheckCircle2, XCircle,
} from "lucide-react";
import { performanceMonitor } from "@/services/performance-monitor";
import type { PerformanceSummary, HealthStatus } from "@/services/performance-monitor";

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
      {/* Header */}
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

      {/* Tab Navigation */}
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

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function PerfKpiCard({ label, value, unit, icon: Icon, status, subtitle }: {
  label: string; value: string | number; unit?: string; icon: import("@/types/common").IconType;
  status: "healthy" | "warning" | "critical" | "neutral"; subtitle?: string;
}) {
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
          <p className={cn("text-sm font-bold tabular-nums", status === "healthy" ? "text-emerald-400" : status === "warning" ? "text-amber-400" : status === "critical" ? "text-red-400" : "")}>
            {value}{unit ?? ""}
          </p>
          {subtitle && <p className="text-[9px] text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ============= Overview ============= */
function OverviewView({ summary, health }: { summary: PerformanceSummary; health: HealthStatus }) {
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
        {/* Latency Percentiles */}
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

        {/* System Health Checks */}
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

        {/* Slow Endpoints */}
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Slow Endpoints</h3>
            <div className="space-y-1">
              {summary.slowEndpoints.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">No slow endpoints detected</p>
              ) : (
                summary.slowEndpoints.map((ep) => (
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

/* ============= Latency View ============= */
function LatencyView({ summary }: { summary: PerformanceSummary }) {
  const records = performanceMonitor.getApiLatency();
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? records : records.filter((r) => r.path === filter);
  const paths = [...new Set(records.map((r) => r.path))];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        {paths.map((p) => (
          <Button key={p} variant={filter === p ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter(p)}>{p}</Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">P50</p><p className="text-lg font-bold text-emerald-400 tabular-nums">{summary.p50LatencyMs}ms</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">P95</p><p className="text-lg font-bold text-amber-400 tabular-nums">{summary.p95LatencyMs}ms</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">P99</p><p className="text-lg font-bold text-red-400 tabular-nums">{summary.p99LatencyMs}ms</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Total Requests</p><p className="text-lg font-bold tabular-nums text-card-foreground">{filtered.length}</p></CardContent></Card>
      </div>

      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">API Latency Records</h3>
          <div className="space-y-1">
            {filtered.slice(0, 30).map((r, i) => (
              <div key={`${r.correlationId}-${i}`} className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1.5">
                <div className={cn("h-2 w-2 shrink-0 rounded-full", r.statusCode < 300 ? "bg-emerald-500" : r.statusCode < 500 ? "bg-amber-500" : "bg-red-500")} />
                <span className="w-24 text-[10px] text-card-foreground">{r.method}</span>
                <span className="flex-1 text-[10px] text-muted-foreground">{r.path}</span>
                <span className={cn("text-[10px] font-medium tabular-nums", r.durationMs > 400 ? "text-red-400" : r.durationMs > 200 ? "text-amber-400" : "text-emerald-400")}>{r.durationMs}ms</span>
                <Badge variant="outline" className={cn("text-[8px]", r.statusCode < 300 ? "text-emerald-400" : r.statusCode < 500 ? "text-amber-400" : "text-red-400")}>{r.statusCode}</Badge>
                <span className="text-[9px] text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============= Health View ============= */
function HealthView({ health }: { health: HealthStatus }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Overall Status</p><Badge variant="outline" className={cn("mt-1 text-[10px]", health.status === "healthy" ? "text-emerald-400 border-emerald-500/20" : health.status === "degraded" ? "text-amber-400 border-amber-500/20" : "text-red-400 border-red-500/20")}>{health.status}</Badge></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Uptime</p><p className="text-lg font-bold tabular-nums text-card-foreground">{formatUptime(health.uptimeSeconds)}</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Last Check</p><p className="text-xs font-medium tabular-nums text-card-foreground">{new Date(health.lastCheck).toLocaleTimeString()}</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">API Status</p><Badge variant="outline" className={cn("mt-1 text-[10px]", health.checks.api?.status === "healthy" ? "text-emerald-400" : "text-amber-400")}>{health.checks.api?.status}</Badge></CardContent></Card>
      </div>

      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Health Check Details</h3>
          <div className="space-y-2">
            {Object.entries(health.checks).map(([key, check]) => (
              <div key={key} className="rounded-md border border-primary/10 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {check.status === "healthy" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                    <span className="text-xs font-medium capitalize text-card-foreground">{key}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", check.status === "healthy" ? "text-emerald-400 border-emerald-500/20" : check.status === "degraded" ? "text-amber-400 border-amber-500/20" : "text-red-400 border-red-500/20")}>{check.status}</Badge>
                </div>
                {check.latencyMs > 0 && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Value: {check.latencyMs}{key === "memory" ? "MB" : key === "errors" ? "%" : "ms"}
                  </p>
                )}
                {check.error && <p className="mt-1 text-[10px] text-red-400">{check.error}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============= Cache View ============= */
function CacheView() {
  const cacheStats = performanceMonitor.getCacheStats();
  const entries = Object.entries(cacheStats);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Cache Stores</p><p className="text-lg font-bold tabular-nums text-card-foreground">{entries.length}</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Total Items</p><p className="text-lg font-bold tabular-nums text-card-foreground">{entries.reduce((s, [, v]) => s + v.size, 0)}</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Total Hits</p><p className="text-lg font-bold tabular-nums text-emerald-400">{entries.reduce((s, [, v]) => s + v.hits, 0)}</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Total Misses</p><p className="text-lg font-bold tabular-nums text-red-400">{entries.reduce((s, [, v]) => s + v.misses, 0)}</p></CardContent></Card>
      </div>

      {entries.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">No cache stores active</div>
      ) : (
        <div className="space-y-1">
          {entries.map(([name, stats]) => (
            <div key={name} className="flex items-center gap-3 rounded-md border border-primary/10 bg-gradient-to-br from-background to-primary/[0.02] p-2.5">
              <Database className="h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium capitalize text-card-foreground">{name}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{stats.size} items</span>
                  <span>{stats.hits} hits</span>
                  <span>{stats.misses} misses</span>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("text-sm font-bold tabular-nums", stats.hitRate >= 70 ? "text-emerald-400" : stats.hitRate >= 40 ? "text-amber-400" : "text-red-400")}>{stats.hitRate}%</p>
                <p className="text-[9px] text-muted-foreground">hit rate</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============= Web Vitals View ============= */
function WebVitalsView({ summary }: { summary: PerformanceSummary }) {
  const vitals = [
    { label: "LCP (Largest Contentful Paint)", value: summary.lcpMs, unit: "ms", target: 2500, status: summary.lcpMs < 2500 ? "healthy" : summary.lcpMs < 4000 ? "warning" : "critical" },
    { label: "INP (Interaction to Next Paint)", value: summary.inpMs, unit: "ms", target: 200, status: summary.inpMs < 200 ? "healthy" : summary.inpMs < 500 ? "warning" : "critical" },
    { label: "CLS (Cumulative Layout Shift)", value: summary.cls, unit: "", target: 0.1, status: summary.cls < 0.1 ? "healthy" : summary.cls < 0.25 ? "warning" : "critical" },
    { label: "Avg Page Load", value: summary.avgPageLoadMs, unit: "ms", target: 2000, status: summary.avgPageLoadMs < 2000 ? "healthy" : summary.avgPageLoadMs < 4000 ? "warning" : "critical" },
    { label: "AI Response Time", value: summary.avgAiResponseMs, unit: "ms", target: 2000, status: summary.avgAiResponseMs < 2000 ? "healthy" : summary.avgAiResponseMs < 4000 ? "warning" : "critical" },
    { label: "Bundle Size", value: summary.bundleSizeKb, unit: "KB", target: 500, status: summary.bundleSizeKb < 500 ? "healthy" : summary.bundleSizeKb < 800 ? "warning" : "critical" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {vitals.map((v) => {
          const pctOfTarget = Math.min(100, Math.round((v.value / v.target) * 100));
          return (
            <Card key={v.label} className="border-primary/10">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">{v.label}</p>
                  <Badge variant="outline" className={cn("text-[8px]", v.status === "healthy" ? "text-emerald-400" : v.status === "warning" ? "text-amber-400" : "text-red-400")}>{v.status}</Badge>
                </div>
                <p className={cn("mt-1 text-lg font-bold tabular-nums", v.status === "healthy" ? "text-emerald-400" : v.status === "warning" ? "text-amber-400" : "text-red-400")}>{v.value}{v.unit}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                  <div className={cn("h-full rounded-full transition-all", v.status === "healthy" ? "bg-emerald-500" : v.status === "warning" ? "bg-amber-500" : "bg-red-500")} style={{ width: `${pctOfTarget}%` }} />
                </div>
                <p className="mt-1 text-[9px] text-muted-foreground">Target: {v.target}{v.unit}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============= Recommendations View ============= */
function RecommendationsView({ summary, health }: { summary: PerformanceSummary; health: HealthStatus }) {
  const recs: { priority: "critical" | "high" | "medium" | "low"; title: string; detail: string }[] = [];

  if (summary.avgPageLoadMs > 3000) recs.push({ priority: "high", title: "Reduce page load time", detail: `Current: ${summary.avgPageLoadMs}ms. Consider server components, route splitting, and lazy loading.` });
  if (summary.avgApiLatencyMs > 500) recs.push({ priority: "high", title: "Optimize API response times", detail: `Current: ${summary.avgApiLatencyMs}ms average. Implement caching, connection pooling, and query optimization.` });
  if (summary.cacheHitRate < 50) recs.push({ priority: "high", title: "Improve cache hit rate", detail: `Current: ${summary.cacheHitRate}%. Increase TTLs, add stale-while-revalidate, and warm frequently accessed keys.` });
  if (summary.errorRate > 10) recs.push({ priority: "critical", title: "Reduce error rate", detail: `Current: ${summary.errorRate}% error rate. Review recent 5xx responses and implement circuit breakers.` });
  if (summary.memoryUsageMb > 400) recs.push({ priority: "medium", title: "Reduce memory consumption", detail: `Current: ${summary.memoryUsageMb}MB. Check for memory leaks and optimize large data structures.` });
  if (summary.lcpMs > 2500) recs.push({ priority: "high", title: "Optimize Largest Contentful Paint", detail: `Current: ${summary.lcpMs}ms. Optimize images, reduce render-blocking resources, and improve server response time.` });
  if (summary.inpMs > 200) recs.push({ priority: "medium", title: "Improve Interaction to Next Paint", detail: `Current: ${summary.inpMs}ms. Reduce main thread blocking, use web workers, and optimize event handlers.` });
  if (summary.cls > 0.1) recs.push({ priority: "medium", title: "Reduce Cumulative Layout Shift", detail: `Current: ${summary.cls}. Set explicit dimensions for images and embeds.` });
  if (summary.bundleSizeKb > 500) recs.push({ priority: "medium", title: "Reduce JavaScript bundle size", detail: `Current: ${summary.bundleSizeKb}KB. Implement code splitting, dynamic imports, and tree shaking.` });
  if (health.checks.api?.status !== "healthy") recs.push({ priority: "critical", title: "API health degraded", detail: "API health checks are not passing. Investigate and resolve immediately." });
  if (summary.p95LatencyMs > 1000) recs.push({ priority: "high", title: "Reduce P95 latency", detail: `Current: ${summary.p95LatencyMs}ms. Profile slow endpoints and implement caching or pagination improvements.` });
  if (summary.avgAiResponseMs > 3000) recs.push({ priority: "medium", title: "Accelerate AI response times", detail: `Current: ${summary.avgAiResponseMs}ms. Consider streaming responses, model optimization, or response caching.` });

  recs.push(
    { priority: "low", title: "Enable gzip/brotli compression", detail: "Ensure all API responses are compressed to reduce payload size." },
    { priority: "low", title: "Implement request deduplication", detail: "Use request batching and deduplication to reduce redundant API calls." },
    { priority: "low", title: "Add connection pooling", detail: "Reuse database and API connections to reduce handshake overhead." },
  );

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/20">{recs.filter((r) => r.priority === "critical").length} Critical</Badge>
        <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-500/20">{recs.filter((r) => r.priority === "high").length} High</Badge>
        <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/20">{recs.filter((r) => r.priority === "medium").length} Medium</Badge>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">{recs.filter((r) => r.priority === "low").length} Low</Badge>
      </div>
      <div className="space-y-1">
        {recs.map((rec, i) => (
          <div key={i} className="flex items-start gap-2 rounded-md border border-primary/10 bg-gradient-to-br from-background to-primary/[0.02] p-2.5">
            <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", rec.priority === "critical" ? "bg-red-500/20" : rec.priority === "high" ? "bg-orange-500/20" : rec.priority === "medium" ? "bg-amber-500/20" : "bg-primary/10")}>
              <Zap className={cn("h-3 w-3", rec.priority === "critical" ? "text-red-400" : rec.priority === "high" ? "text-orange-400" : rec.priority === "medium" ? "text-amber-400" : "text-muted-foreground")} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-card-foreground">{rec.title}</span>
                <Badge variant="outline" className={cn("text-[8px]", rec.priority === "critical" ? "text-red-400 border-red-500/20" : rec.priority === "high" ? "text-orange-400 border-orange-500/20" : rec.priority === "medium" ? "text-amber-400 border-amber-500/20" : "text-muted-foreground")}>{rec.priority}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">{rec.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

