"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, Clock, MapPin, AlertTriangle } from "lucide-react";
import type { DigitalIncident } from "../types";
import { INCIDENT_SEVERITIES } from "../constants";

interface LiveIncidentsPanelProps {
  incidents: DigitalIncident[];
  onSelect: (id: string) => void;
  className?: string;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/20 text-red-400",
  high: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  medium: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  low: "bg-blue-500/10 border-blue-500/20 text-blue-400",
};

export function LiveIncidentsPanel({ incidents, onSelect, className }: LiveIncidentsPanelProps) {
  const active = incidents.filter((i) => i.status === "active" || i.status === "acknowledged");
  const sorted = [...active].sort((a, b) => {
    const sa = INCIDENT_SEVERITIES.indexOf(a.severity);
    const sb = INCIDENT_SEVERITIES.indexOf(b.severity);
    return sa - sb;
  });

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Live Incidents</span>
          <Badge variant="outline" className={cn(
            "text-[10px]",
            active.some((i) => i.severity === "critical") && "bg-red-500/10 text-red-400",
          )}>
            {active.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
            No active incidents
          </div>
        ) : (
          sorted.map((incident) => (
            <button
              key={incident.id}
              className={cn(
                "w-full rounded-md border p-2.5 text-left transition-all hover:brightness-110",
                severityColors[incident.severity] ?? "border-muted bg-muted/20",
              )}
              onClick={() => onSelect(incident.zoneId)}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  {incident.severity === "critical" || incident.severity === "high" ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {incident.type.replace(/_/g, " ")}
                </span>
                <span className="rounded bg-background/60 px-1.5 py-0.5 text-[9px]">{incident.severity}</span>
              </div>
              <p className="mb-1 text-[10px] text-muted-foreground">{incident.description}</p>
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {incident.zoneId}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(incident.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

