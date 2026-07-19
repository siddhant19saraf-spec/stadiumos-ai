"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import type { PerformanceSummary, HealthStatus, PerfRecommendation } from "../types";

function buildRecommendations(summary: PerformanceSummary, health: HealthStatus): PerfRecommendation[] {
  const recs: PerfRecommendation[] = [];

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

  return recs;
}

export function RecommendationsView({ summary, health }: { summary: PerformanceSummary; health: HealthStatus }) {
  const recs = buildRecommendations(summary, health);

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
