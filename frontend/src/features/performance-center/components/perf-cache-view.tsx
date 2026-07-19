"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Database } from "lucide-react";
import { performanceMonitor } from "@/services/performance-monitor";

export function CacheView() {
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
          {entries.map(([name, stats]) => {
            const hitRate = stats.hits / (stats.hits + stats.misses) * 100 || 0;
            return (
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
                <p className={cn("text-sm font-bold tabular-nums", hitRate >= 70 ? "text-emerald-400" : hitRate >= 40 ? "text-amber-400" : "text-red-400")}>{hitRate}%</p>
                <p className="text-[9px] text-muted-foreground">hit rate</p>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
