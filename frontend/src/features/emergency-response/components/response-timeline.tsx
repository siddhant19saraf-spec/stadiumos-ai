"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, AlertTriangle, Send, Search, Activity, Shield } from "lucide-react";
import type { Incident } from "../types";

interface ResponseTimelineProps {
  incident: Incident | null;
  className?: string;
}

const actionIcons: Record<string, React.ElementType> = {
  "incident reported": AlertTriangle,
  "ai analysis complete": Search,
  "incident processing started": Activity,
  "team dispatched": Send,
  "status changed": Clock,
  "incident resolved": CheckCircle,
};

function getIcon(action: string): React.ElementType {
  const lowered = action.toLowerCase();
  for (const [key, Icon] of Object.entries(actionIcons)) {
    if (lowered.includes(key)) return Icon;
  }
  return Clock;
}

export function ResponseTimeline({ incident, className }: ResponseTimelineProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          {incident ? `Response Timeline — ${incident.title.slice(0, 30)}...` : "Response Timeline"}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        {!incident && (
          <div className="py-8 text-center text-sm text-muted-foreground">Select an incident to view its timeline</div>
        )}
        {incident && (
          <div className="relative space-y-0">
            {incident.timeline.length === 0 && (
              <div className="py-4 text-center text-xs text-muted-foreground">No timeline entries available</div>
            )}
            <div className="absolute bottom-0 left-[11px] top-0 w-0.5 bg-border" aria-hidden="true" />
            {incident.timeline.map((entry, idx) => {
              const Icon = getIcon(entry.action);
              return (
                <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                  <div className={cn(
                    "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                    idx === 0 ? "border-red-500 bg-red-500/10" :
                    idx === incident.timeline.length - 1 && incident.status === "resolved" ? "border-emerald-500 bg-emerald-500/10" :
                    "border-primary bg-primary/10",
                  )}>
                    <Icon className={cn(
                      "h-3 w-3",
                      idx === 0 ? "text-red-400" :
                      idx === incident.timeline.length - 1 && incident.status === "resolved" ? "text-emerald-400" :
                      "text-primary",
                    )} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-card-foreground">{entry.action}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.actor} — {entry.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

