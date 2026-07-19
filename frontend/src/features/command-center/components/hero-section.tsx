"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIStatusBadge } from "./ai-status-badge";
import { MapPin, Calendar, Thermometer, ShieldCheck, Activity, Users, Trophy } from "lucide-react";
import type { StadiumInfo, TournamentInfo, CurrentMatch, HeroMetrics, AIProviderStatus } from "../types";

interface HeroSectionProps {
  stadium: StadiumInfo;
  tournament: TournamentInfo;
  match: CurrentMatch;
  metrics: HeroMetrics;
  aiStatus: AIProviderStatus;
  className?: string;
}

export function HeroSection({
  stadium,
  tournament,
  match,
  metrics,
  aiStatus,
  className,
}: HeroSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Operations Command Center</h1>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Live
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {stadium.name}, {stadium.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              Match Day {tournament.matchDay} of {tournament.totalMatchDays}
            </span>
          </div>
        </div>
        <AIStatusBadge status={aiStatus} healthScore={metrics.aiHealthScore} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Match */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Current Match
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground truncate max-w-[100px]">{match.homeTeam}</span>
              <span className="text-2xl font-bold tracking-tighter text-foreground">{match.homeScore} - {match.awayScore}</span>
              <span className="text-sm font-semibold text-foreground truncate max-w-[100px] text-right">{match.awayTeam}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {match.status === "second_half" && (
                <Badge variant="secondary" className="text-[10px]">{match.minute}&apos;</Badge>
              )}
              <span>{match.status === "pregame" ? "Pre-game" : match.status === "half_time" ? "Half Time" : match.status === "final" ? "Full Time" : `2nd Half`}</span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance & Capacity */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Attendance
            </div>
            <p className="mb-1 text-2xl font-bold tracking-tight text-foreground">
              {metrics.attendance.toLocaleString()}
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-medium text-foreground">{metrics.capacityPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    metrics.capacityPercent > 90 ? "bg-red-400" : metrics.capacityPercent > 75 ? "bg-amber-400" : "bg-emerald-400",
                  )}
                  style={{ width: `${metrics.capacityPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {metrics.capacity - metrics.attendance} seats remaining
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weather & Risk */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
              Conditions
            </div>
            <p className="mb-1 text-2xl font-bold tracking-tight text-foreground">
              {metrics.weather.temperature}°C
            </p>
            <p className="text-xs text-muted-foreground">{metrics.weather.condition}</p>
            <div className="mt-2 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">Risk Level: </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  metrics.riskLevel === "critical" && "border-red-500/30 text-red-400",
                  metrics.riskLevel === "high" && "border-red-500/20 text-red-400",
                  metrics.riskLevel === "medium" && "border-amber-500/20 text-amber-400",
                  metrics.riskLevel === "low" && "border-emerald-500/20 text-emerald-400",
                )}
              >
                {metrics.riskLevel.charAt(0).toUpperCase() + metrics.riskLevel.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* AI Health */}
        <Card className="bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              System Health
            </div>
            <p className="mb-1 text-2xl font-bold tracking-tight text-foreground">
              {metrics.aiHealthScore.toFixed(1)}%
            </p>
            <div className="flex items-center gap-1 text-xs">
              <span className={cn(
                "h-2 w-2 rounded-full",
                aiStatus === "operational" && "bg-emerald-400",
                aiStatus === "degraded" && "bg-amber-400",
                aiStatus === "down" && "bg-red-400",
              )} aria-hidden="true" />
              <span className="text-muted-foreground">
                {aiStatus === "operational" ? "All systems nominal" : aiStatus === "degraded" ? "Degraded performance" : "System offline"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
