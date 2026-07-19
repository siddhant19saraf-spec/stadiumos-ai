"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import type { Conflict } from "../types";

interface ConflictPanelProps {
  conflicts: Conflict[];
  className?: string;
}

const severityColor: Record<string, string> = {
  critical: "border-l-red-500 bg-red-500/5",
  high: "border-l-orange-500 bg-orange-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-emerald-500 bg-emerald-500/5",
};
const severityBadge: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400",
  high: "bg-orange-500/10 text-orange-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-emerald-500/10 text-emerald-400",
};
const typeLabels: Record<string, string> = {
  venue_double_booked: "Venue Conflict", time_overlap: "Time Overlap",
  insufficient_staff: "Staffing Gap", broadcast_conflict: "Broadcast Conflict",
  maintenance_conflict: "Maintenance", parking_overflow: "Parking Overflow",
  emergency_overlap: "Emergency Overlap", weather_conflict: "Weather",
  team_rest_violation: "Rest Violation", security_gap: "Security Gap",
};

export function ConflictPanel({ conflicts, className }: ConflictPanelProps) {
  const sorted = [...conflicts].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
  const unresolved = sorted.filter((c) => !c.resolved);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          AI Conflict Detection
          {unresolved.length > 0 && (
            <Badge variant="outline" className="ml-auto bg-red-500/10 text-[10px] text-red-400">{unresolved.length} active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[450px] space-y-3 overflow-y-auto">
        {conflicts.length === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/5 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">No conflicts detected</span>
          </div>
        )}
        {sorted.map((conflict) => (
          <div key={conflict.id} className={cn("rounded-md border-l-4 p-3", severityColor[conflict.severity], conflict.resolved && "opacity-50")}>
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-card-foreground">{conflict.title}</span>
                  <Badge variant="outline" className={cn("text-[9px]", severityBadge[conflict.severity])}>
                    {conflict.severity}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{conflict.description}</p>
                <span className="mt-0.5 inline-block rounded bg-muted/50 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  {typeLabels[conflict.type] ?? conflict.type.replace(/_/g, " ")}
                </span>
              </div>
              {conflict.resolved && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
            </div>
            {!conflict.resolved && (
              <div className="mt-2 flex items-start gap-1.5 rounded bg-primary/5 px-2 py-1.5 text-[10px]">
                <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                <span className="text-card-foreground">{conflict.aiResolution}</span>
                <span className="shrink-0 text-muted-foreground">({conflict.aiConfidence}% AI conf)</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
