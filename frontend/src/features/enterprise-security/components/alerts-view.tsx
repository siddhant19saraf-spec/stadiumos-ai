"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { SecurityAlert } from "../types";
import { securityMonitorEngine } from "../services/security-monitor-engine";

export function AlertsView({ alerts }: { alerts: SecurityAlert[] }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? alerts : filter === "unacked" ? alerts.filter((a) => !a.acknowledged) : alerts.filter((a) => a.severity === filter);
  const totalUnacked = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "unacked" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("unacked")}>Unacknowledged ({totalUnacked})</Button>
          <Button variant={filter === "critical" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("critical")}>Critical</Button>
          <Button variant={filter === "high" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("high")}>High</Button>
          <Button variant={filter === "medium" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("medium")}>Medium</Button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">No alerts match filter</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => (
            <Card key={alert.id} className={cn("border-l-4", alert.severity === "critical" ? "border-l-red-500" : alert.severity === "high" ? "border-l-orange-500" : alert.severity === "medium" ? "border-l-amber-500" : "border-l-blue-500", alert.acknowledged && "opacity-50")}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("h-3.5 w-3.5", alert.severity === "critical" ? "text-red-400" : alert.severity === "high" ? "text-orange-400" : "text-amber-400")} />
                      <span className="text-sm font-medium text-card-foreground">{alert.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", alert.severity === "critical" ? "text-red-400 border-red-500/20" : alert.severity === "high" ? "text-orange-400 border-orange-500/20" : "text-amber-400 border-amber-500/20")}>{alert.severity}</Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">{alert.type.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{alert.message}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>User: {alert.user}</span>
                      <span>IP: {alert.ipAddress}</span>
                      <span>Source: {alert.source}</span>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button variant="ghost" size="sm" className="h-7 shrink-0 text-[10px]" onClick={() => securityMonitorEngine.acknowledgeAlert(alert.id, "admin")}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Acknowledge
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
