import { CacheStore, cacheStoreManager } from "@/lib/performance/cache";

/* ——— Types ——— */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "percent" | "count" | "score";
  timestamp: string;
  tags: Record<string, string>;
}

export interface ApiLatencyRecord {
  path: string;
  method: string;
  durationMs: number;
  statusCode: number;
  timestamp: string;
  correlationId: string;
}

export interface PerformanceSummary {
  avgPageLoadMs: number;
  avgApiLatencyMs: number;
  avgAiResponseMs: number;
  memoryUsageMb: number;
  bundleSizeKb: number;
  lcpMs: number;
  inpMs: number;
  cls: number;
  cacheHitRate: number;
  totalRequests: number;
  errorRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  slowEndpoints: { path: string; avgMs: number; count: number }[];
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  uptimeSeconds: number;
  lastCheck: string;
  checks: Record<string, { status: string; latencyMs: number; error?: string }>;
}

/* ——— Engine ——— */
export interface IPerformanceMonitorEngine {
  recordMetric(metric: PerformanceMetric): void;
  recordApiLatency(record: ApiLatencyRecord): void;
  getMetrics(name?: string): PerformanceMetric[];
  getApiLatency(path?: string): ApiLatencyRecord[];
  computeSummary(): PerformanceSummary;
  getHealthCheck(): HealthStatus;
  getCacheStats(): Record<string, { size: number; hits: number; misses: number; hitRate: number }>;
  getSlowEndpoints(minRequests?: number): { path: string; avgMs: number; count: number }[];
  reset(): void;
}

export class MockPerformanceMonitorEngine implements IPerformanceMonitorEngine {
  private metrics: PerformanceMetric[] = [];
  private apiRecords: ApiLatencyRecord[] = [];
  private startTime = Date.now();
  private readonly MAX_RECORDS = 10000;

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.unshift(metric);
    if (this.metrics.length > this.MAX_RECORDS) this.metrics = this.metrics.slice(0, this.MAX_RECORDS);
  }

  recordApiLatency(record: ApiLatencyRecord): void {
    this.apiRecords.unshift(record);
    if (this.apiRecords.length > this.MAX_RECORDS) this.apiRecords = this.apiRecords.slice(0, this.MAX_RECORDS);
  }

  getMetrics(name?: string): PerformanceMetric[] {
    return name ? this.metrics.filter((m) => m.name === name) : [...this.metrics];
  }

  getApiLatency(path?: string): ApiLatencyRecord[] {
    return path ? this.apiRecords.filter((r) => r.path === path) : [...this.apiRecords];
  }

  computeSummary(): PerformanceSummary {
    const pageLoads = this.metrics.filter((m) => m.name === "page_load");
    const apiLatencies = this.apiRecords;
    const aiResponses = this.metrics.filter((m) => m.name === "ai_response");

    const avgPageLoadMs = pageLoads.length > 0
      ? Math.round(pageLoads.reduce((s, m) => s + m.value, 0) / pageLoads.length) : 0;
    const avgApiLatencyMs = apiLatencies.length > 0
      ? Math.round(apiLatencies.reduce((s, r) => s + r.durationMs, 0) / apiLatencies.length) : 0;
    const avgAiResponseMs = aiResponses.length > 0
      ? Math.round(aiResponses.reduce((s, m) => s + m.value, 0) / aiResponses.length) : 0;
    const errors = apiLatencies.filter((r) => r.statusCode >= 400);

    const latencies = apiLatencies.map((r) => r.durationMs).sort((a, b) => a - b);
    const total = latencies.length;
    const p50 = total > 0 ? latencies[Math.floor(total * 0.5)] ?? 0 : 0;
    const p95 = total > 0 ? latencies[Math.floor(total * 0.95)] ?? 0 : 0;
    const p99 = total > 0 ? latencies[Math.floor(total * 0.99)] ?? 0 : 0;

    const slowEndpoints = this.getSlowEndpoints(3);

    const cacheStats = this.getCacheStats();
    const totalHits = Object.values(cacheStats).reduce((s, c) => s + c.hits, 0);
    const totalMisses = Object.values(cacheStats).reduce((s, c) => s + c.misses, 0);
    const cacheHitRate = totalHits + totalMisses > 0
      ? Math.round((totalHits / (totalHits + totalMisses)) * 100) : 0;

    return {
      avgPageLoadMs,
      avgApiLatencyMs,
      avgAiResponseMs,
      memoryUsageMb: Math.round(process.memoryUsage?.().heapUsed / 1024 / 1024) || 0,
      bundleSizeKb: 0,
      lcpMs: this.getLastMetric("lcp") ?? 0,
      inpMs: this.getLastMetric("inp") ?? 0,
      cls: this.getLastMetric("cls") ?? 0,
      cacheHitRate,
      totalRequests: apiLatencies.length,
      errorRate: apiLatencies.length > 0
        ? Math.round((errors.length / apiLatencies.length) * 100) : 0,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      slowEndpoints,
    };
  }

  getHealthCheck(): HealthStatus {
    const summary = this.computeSummary();
    const checks: Record<string, { status: string; latencyMs: number; error?: string }> = {
      api: { status: summary.avgApiLatencyMs < 500 ? "healthy" : summary.avgApiLatencyMs < 1000 ? "degraded" : "unhealthy", latencyMs: summary.avgApiLatencyMs },
      cache: { status: summary.cacheHitRate > 50 ? "healthy" : summary.cacheHitRate > 20 ? "degraded" : "unhealthy", latencyMs: 0 },
      memory: { status: summary.memoryUsageMb < 500 ? "healthy" : summary.memoryUsageMb < 800 ? "degraded" : "unhealthy", latencyMs: summary.memoryUsageMb },
      errors: { status: summary.errorRate < 5 ? "healthy" : summary.errorRate < 15 ? "degraded" : "unhealthy", latencyMs: summary.errorRate },
    };

    const statuses = Object.values(checks).map((c) => c.status);
    const overall: HealthStatus["status"] = statuses.every((s) => s === "healthy") ? "healthy"
      : statuses.some((s) => s === "unhealthy") ? "unhealthy" : "degraded";

    return {
      status: overall,
      uptimeSeconds: Math.round((Date.now() - this.startTime) / 1000),
      lastCheck: new Date().toISOString(),
      checks,
    };
  }

  getCacheStats() {
    return cacheStoreManager.getAllStats();
  }

  getSlowEndpoints(minRequests = 3): { path: string; avgMs: number; count: number }[] {
    const grouped = new Map<string, { total: number; count: number }>();
    for (const r of this.apiRecords) {
      const existing = grouped.get(r.path) ?? { total: 0, count: 0 };
      existing.total += r.durationMs;
      existing.count++;
      grouped.set(r.path, existing);
    }
    return Array.from(grouped.entries())
      .filter(([, data]) => data.count >= minRequests)
      .map(([path, data]) => ({ path, avgMs: Math.round(data.total / data.count), count: data.count }))
      .sort((a, b) => b.avgMs - a.avgMs)
      .slice(0, 10);
  }

  reset(): void {
    this.metrics = [];
    this.apiRecords = [];
    this.startTime = Date.now();
  }

  private getLastMetric(name: string): number | null {
    const items = this.metrics.filter((m) => m.name === name);
    return items.length > 0 ? items[0].value : null;
  }

  seedMockData(): void {
    const now = Date.now();
    for (let i = 0; i < 100; i++) {
      const time = new Date(now - i * 60000);
      this.apiRecords.push({
        path: ["/api/crowd", "/api/energy", "/api/parking", "/api/emergency", "/api/analytics"][i % 5],
        method: "GET",
        durationMs: Math.round(50 + Math.random() * 450),
        statusCode: Math.random() > 0.1 ? 200 : [400, 401, 500][Math.floor(Math.random() * 3)],
        timestamp: time.toISOString(),
        correlationId: `corr-${time.getTime().toString(36)}`,
      });
    }

    this.metrics.push(
      { name: "page_load", value: 1200 + Math.random() * 800, unit: "ms", timestamp: new Date().toISOString(), tags: { route: "/command-center" } },
      { name: "page_load", value: 800 + Math.random() * 400, unit: "ms", timestamp: new Date().toISOString(), tags: { route: "/crowd-intelligence" } },
      { name: "page_load", value: 2000 + Math.random() * 1000, unit: "ms", timestamp: new Date().toISOString(), tags: { route: "/executive-analytics" } },
      { name: "ai_response", value: 1500 + Math.random() * 2000, unit: "ms", timestamp: new Date().toISOString(), tags: { engine: "copilot" } },
      { name: "ai_response", value: 500 + Math.random() * 500, unit: "ms", timestamp: new Date().toISOString(), tags: { engine: "prediction" } },
      { name: "lcp", value: 1800 + Math.random() * 1200, unit: "ms", timestamp: new Date().toISOString(), tags: {} },
      { name: "inp", value: 100 + Math.random() * 150, unit: "ms", timestamp: new Date().toISOString(), tags: {} },
      { name: "cls", value: Math.random() * 0.2, unit: "score", timestamp: new Date().toISOString(), tags: {} },
      { name: "memory", value: 120 + Math.random() * 80, unit: "mb", timestamp: new Date().toISOString(), tags: {} },
      { name: "bundle", value: 450 + Math.random() * 100, unit: "kb", timestamp: new Date().toISOString(), tags: {} },
    );
  }
}

export const performanceMonitor = new MockPerformanceMonitorEngine();
performanceMonitor.seedMockData();
