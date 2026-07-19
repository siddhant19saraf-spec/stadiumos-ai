"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Shield, AlertTriangle, Bot, ArrowRight, Clock } from "lucide-react";
import type { ActivityEvent } from "../types";

interface ActivityFeedProps {
  events: ActivityEvent[];
  className?: string;
}

const typeConfig = {
  alert: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  action: { icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10" },
  system: { icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ai: { icon: Bot, color: "text-purple-400", bg: "bg-purple-500/10" },
};

function getRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function ActivityFeed({ events, className }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          Live Activity
          <span className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Live</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin" role="log" aria-label="Live activity feed" aria-live="polite">
          {events.map((event, index) => {
            const config = typeConfig[event.type];
            const Icon = config.icon;
            const isLast = index === events.length - 1;

            return (
              <div
                key={event.id}
                className={cn(
                  "relative flex gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20",
                  !isLast && "border-b border-border/40",
                )}
              >
                <div className="relative flex flex-col items-center">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-full", config.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", config.color)} aria-hidden="true" />
                  </div>
                  {!isLast && <div className="mt-1 h-full w-px bg-border/50" aria-hidden="true" />}
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs leading-relaxed text-foreground/85">{event.message}</p>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{event.module}</Badge>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {getRelativeTime(event.timestamp)}
                    </span>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-muted-foreground/40" aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
