"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ExecutiveAnalyticsData } from "../types";

export function AlertsView({ state, onAcknowledge }: { state: ExecutiveAnalyticsData; onAcknowledge: (id: string) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? state.alerts :
    filter === "unacked" ? state.alerts.filter((a) => !a.acknowledged) :
    state.alerts.filter((a) => a.severity === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        <Button variant={filter === "unacked" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("unacked")}>Unacknowledged</Button>
        <Button variant={filter === "critical" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("critical")}>Critical</Button>
        <Button variant={filter === "severe" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("severe")}>Severe</Button>
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No alerts match filter
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => (
            <Card key={alert.id} className={cn(
              "border-l-4 border-primary/10",
              alert.severity === "critical" ? "border-l-red-500" : alert.severity === "severe" ? "border-l-orange-500" :
              alert.severity === "high" ? "border-l-amber-500" : "border-l-blue-500",
              alert.acknowledged && "opacity-50",
            )}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("h-3.5 w-3.5", alert.severity === "critical" || alert.severity === "severe" ? "text-red-400" : "text-amber-400")} />
                      <span className="text-sm font-medium text-card-foreground">{alert.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", alert.severity === "critical" ? "text-red-400 border-red-500/20" : alert.severity === "severe" ? "text-orange-400" : alert.severity === "high" ? "text-amber-400" : "text-muted-foreground")}>{alert.severity}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{alert.category.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{alert.escalationLevel}</Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{alert.message}</p>
                  </div>
                  {!alert.acknowledged && (
                    <Button variant="ghost" size="sm" className="h-7 shrink-0 text-[10px]" onClick={() => onAcknowledge(alert.id)}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Acknowledge
                    </Button>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>Source: {alert.sourceModule}</span>
                  <span>Modules: {alert.involvesModules.join(", ")}</span>
                  {alert.requiresExecutiveAction && <Badge variant="outline" className="text-[8px] text-red-400 border-red-500/20">Executive Action Required</Badge>}
                </div>
                <div className="mt-1.5 rounded bg-primary/5 px-2 py-1 text-[10px] text-muted-foreground">
                  <span className="text-primary">AI Suggestion:</span> {alert.aiSuggestion}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
