// @ts-nocheck
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Users, AlertTriangle, Thermometer } from "lucide-react";
import type { Match } from "../types";

interface MatchCardProps {
  match: Match;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

const statusBadge: Record<string, string> = {
  scheduled: "bg-slate-500/10 text-slate-400",
  preparing: "bg-blue-500/10 text-blue-400",
  team_arrival: "bg-purple-500/10 text-purple-400",
  warmup: "bg-amber-500/10 text-amber-400",
  in_progress: "bg-emerald-500/10 text-emerald-400",
  half_time: "bg-amber-500/10 text-amber-400",
  completed: "bg-emerald-500/10 text-emerald-400",
  postponed: "bg-red-500/10 text-red-400",
  cancelled: "bg-red-500/10 text-red-400",
};

const securityColor: Record<string, string> = {
  normal: "text-emerald-400",
  elevated: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

export function MatchCard({ match, isSelected, onSelect, className }: MatchCardProps) {
  const homeTeam = match.title.split(" vs ")[0];
  const awayTeam = match.title.split(" vs ")[1];

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3 text-left transition-all duration-200 hover:bg-muted/20",
        isSelected && "ring-1 ring-primary",
        className,
      )}
      onClick={() => onSelect?.(match.id)}
      aria-label={`Match: ${match.title}`}
      aria-selected={isSelected}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-card-foreground">{homeTeam}</span>
            <span className="text-xs text-muted-foreground">vs</span>
            <span className="text-sm font-semibold text-card-foreground">{awayTeam}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {match.scheduledDate} @ {match.scheduledTime}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {(match.attendance ?? 0).toLocaleString()}
            </span>
            {match.delayMinutes > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                +{match.delayMinutes}min delay
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant="outline" className={cn("text-[10px]", statusBadge[match.status])}>
            {match.status.replace(/_/g, " ")}
          </Badge>
          <span className={cn("flex items-center gap-1 text-[10px]", securityColor[match.securityLevel])}>
            {match.securityLevel}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className={cn("flex items-center gap-1", match.weatherForecast.condition === "storm" || match.weatherForecast.condition === "extreme_heat" ? "text-red-400" : "")}>
          <Thermometer className="h-3 w-3" />
          {match.weatherForecast.temperature}°C {match.weatherForecast.condition}
        </span>
        <span>Attendance: {match.capacityPercent}%</span>
        <span>AI Delay Risk: {match.aiDelayRisk}%</span>
      </div>
    </button>
  );
}

