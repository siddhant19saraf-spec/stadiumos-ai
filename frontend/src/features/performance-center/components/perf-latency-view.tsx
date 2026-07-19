"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { performanceMonitor } from "@/services/performance-monitor";
import type { PerformanceSummary } from "../types";

export function LatencyView({ summary }: { summary: PerformanceSummary }) {
  const records = performanceMonitor.getApiLatency();
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? records : records.filter((r: { path: string }) => r.path === filter);
  const paths = [...new Set(records.map((r: { path: string }) => r.path))] as string[];

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
            {filtered.slice(0, 30).map((r: { correlationId: string; method: string; path: string; durationMs: number; statusCode: number; timestamp: string }, i: number) => (
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
