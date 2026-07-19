import type { PerformanceSummary, HealthStatus } from "@/services/performance-monitor";

export type { PerformanceSummary, HealthStatus };

export type PerfTab = "overview" | "latency" | "health" | "cache" | "webvitals" | "recommendations";

export interface PerfRecommendation {
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  detail: string;
}
