"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, PlayCircle, AlertTriangle } from "lucide-react";
import type { OperationalTimelineEntry } from "../types";

interface OperationalTimelineProps {
  timeline: OperationalTimelineEntry[];
  className?: string;
}

const phaseStatusIcon: Record<string, React.ElementType> = {
  completed: CheckCircle,
  active: PlayCircle,
  delayed: AlertTriangle,
  pending: Clock,
};
const phaseStatusColor: Record<string, string> = {
  completed: "text-emerald-400",
  active: "text-blue-400",
  delayed: "text-red-400",
  pending: "text-muted-foreground",
};

const phaseLabels: Record<string, string> = {
  preparation: "Preparation", security_sweep: "Security Sweep",
  team_arrival: "Team Arrival", warmup: "Warm-up",
  match: "Match", half_time_break: "Half Time",
  post_match: "Post-Match", cleanup: "Cleanup", maintenance: "Maintenance",
};

export function OperationalTimeline({ timeline, className }: OperationalTimelineProps) {
  if (timeline.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4" /> Operational Timeline</CardTitle></CardHeader>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">No upcoming operations</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Operational Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[450px] space-y-4 overflow-y-auto">
        {timeline.slice(0, 4).map((entry) => (
          <div key={entry.id} className="rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-card-foreground">{entry.matchTitle}</span>
              <span className="text-[10px] text-muted-foreground">{entry.venueName}</span>
            </div>
            <div className="relative space-y-0">
              <div className="absolute bottom-0 left-[11px] top-0 w-0.5 bg-border" aria-hidden="true" />
              {entry.phases.map((phase, idx) => {
                const Icon = phaseStatusIcon[phase.status] ?? Clock;
                return (
                  <div key={`${entry.id}-${idx}`} className="relative flex gap-3 pb-3 last:pb-0">
                    <div className={cn("z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", phaseStatusColor[phase.status])}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-card-foreground">{phaseLabels[phase.phase] ?? phase.phase}</span>
                        <Badge variant="outline" className={cn("text-[8px]", phase.status === "active" ? "bg-blue-500/10 text-blue-400" : phase.status === "delayed" ? "bg-red-500/10 text-red-400" : "bg-muted/50 text-muted-foreground")}>
                          {phase.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{phase.durationMinutes} min · {new Date(phase.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
