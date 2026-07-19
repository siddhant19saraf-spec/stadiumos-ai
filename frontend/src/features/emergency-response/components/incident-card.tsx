"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Brain, AlertTriangle, ChevronRight } from "lucide-react";
import type { Incident } from "../types";

interface IncidentCardProps {
  incident: Incident;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDispatch?: (incidentId: string, teamId: string) => void;
  className?: string;
}

const severityColors: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-amber-500",
  low: "border-l-emerald-500",
};

const statusBadge: Record<string, string> = {
  reported: "bg-slate-500/10 text-slate-400",
  analyzing: "bg-blue-500/10 text-blue-400",
  assessing: "bg-purple-500/10 text-purple-400",
  dispatched: "bg-amber-500/10 text-amber-400",
  in_progress: "bg-orange-500/10 text-orange-400",
  contained: "bg-emerald-500/10 text-emerald-400",
  resolved: "bg-emerald-500/10 text-emerald-400",
};

const typeLabels: Record<string, string> = {
  medical_emergency: "Medical", fire: "Fire", security_threat: "Security",
  crowd_surge: "Crowd Surge", stampede_risk: "Stampede",
  suspicious_package: "Suspicious Pkg", infrastructure_failure: "Infra Failure",
  power_failure: "Power", network_failure: "Network",
  weather_emergency: "Weather", vip_incident: "VIP", lost_child: "Lost Child",
};

export function IncidentCard({ incident, isSelected, onSelect, className }: IncidentCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-md border-l-4 border bg-gradient-to-r from-primary/5 to-transparent p-3 text-left transition-all duration-200 hover:bg-muted/20",
        severityColors[incident.severity],
        isSelected && "ring-1 ring-primary",
        className,
      )}
      onClick={() => onSelect?.(incident.id)}
      aria-label={`Incident: ${incident.title} (${incident.severity})`}
      aria-selected={isSelected}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-card-foreground">{incident.title}</span>
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {incident.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Math.round((Date.now() - new Date(incident.reportedAt).getTime()) / 60000)}m ago
            </span>
            <span className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              {incident.aiConfidence}%
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant="outline" className={cn("text-[10px]", statusBadge[incident.status])}>
            {incident.status.replace(/_/g, " ")}
          </Badge>
          <span className="text-[10px] text-muted-foreground capitalize">{typeLabels[incident.type] ?? incident.type.replace(/_/g, " ")}</span>
        </div>
      </div>
      {incident.status === "reported" || incident.status === "analyzing" ? (
        <div className="mt-2 flex items-center gap-1.5 rounded bg-red-500/5 px-2 py-1 text-[10px]">
          <AlertTriangle className="h-3 w-3 text-red-400" />
          <span className="text-red-400">Awaiting dispatch — {incident.estimatedResolutionMinutes}min estimated resolution</span>
        </div>
      ) : incident.assignedTeam ? (
        <div className="mt-2 text-[10px] text-muted-foreground">
          Assigned: {incident.assignedTeam}
        </div>
      ) : null}
    </button>
  );
}

