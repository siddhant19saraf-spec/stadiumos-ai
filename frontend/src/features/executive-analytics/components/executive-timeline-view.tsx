"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import type { ExecutiveAnalyticsData } from "../types";

const severityStyles: Record<string, string> = {
  positive: "border-l-emerald-500", info: "border-l-blue-500",
  warning: "border-l-amber-500", critical: "border-l-red-500",
};

const severityIcons: Record<string, any> = {
  positive: CheckCircle2, info: Clock, warning: AlertTriangle, critical: AlertCircle,
};

export function TimelineView({ state }: { state: ExecutiveAnalyticsData }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? state.timeline : state.timeline.filter((e) => e.type === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        {["incident", "operation", "maintenance", "ai_recommendation", "executive_decision", "milestone"].map((t) => (
          <Button key={t} variant={filter === t ? "default" : "ghost"} size="sm" className="h-7 text-[10px] capitalize" onClick={() => setFilter(t)}>
            {t.replace(/_/g, " ")}
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No timeline events match filter
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((event) => {
            const Icon = severityIcons[event.severity] ?? Clock;
            return (
              <div key={event.id} className={cn("flex items-start gap-3 rounded-md border-l-4 border-primary/10 bg-gradient-to-br from-background to-primary/[0.02] p-3", severityStyles[event.severity] ?? "border-l-primary/10")}>
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", event.severity === "critical" ? "text-red-400" : event.severity === "warning" ? "text-amber-400" : event.severity === "positive" ? "text-emerald-400" : "text-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-card-foreground">{event.title}</span>
                    <Badge variant="outline" className="text-[8px] capitalize text-muted-foreground">{event.type.replace(/_/g, " ")}</Badge>
                    <Badge variant="outline" className="text-[8px] text-muted-foreground">{event.module}</Badge>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{event.description}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
