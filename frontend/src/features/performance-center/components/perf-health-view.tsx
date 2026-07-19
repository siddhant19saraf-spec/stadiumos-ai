"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { HealthStatus } from "../types";

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function HealthView({ health }: { health: HealthStatus }) {
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
