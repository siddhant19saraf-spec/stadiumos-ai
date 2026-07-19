"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trophy, Calendar, AlertTriangle, Shield, TrendingUp, Activity } from "lucide-react";
import type { TournamentAnalytics, Tournament } from "../types";

interface TournamentStatsCardsProps {
  tournament: Tournament;
  analytics: TournamentAnalytics;
  className?: string;
}

const cards = [
  {
    key: "progress",
    label: "Tournament Progress",
    icon: Trophy,
    getValue: (t: Tournament, _a: TournamentAnalytics) => `${t.completedMatches}/${t.totalMatches}`,
    getSub: (t: Tournament, _a: TournamentAnalytics) => `${Math.round((t.completedMatches / t.totalMatches) * 100)}% complete`,
    color: (_t: Tournament, a: TournamentAnalytics) => a.readinessScore > 80 ? "text-emerald-400" : "text-amber-400",
  },
  {
    key: "upcoming",
    label: "Upcoming Matches",
    icon: Calendar,
    getValue: (_t: Tournament, a: TournamentAnalytics) => `${a.upcomingMatches}`,
    getSub: (_t: Tournament, a: TournamentAnalytics) => `${a.totalMatches - a.completedMatches} remaining`,
    color: () => "text-blue-400",
  },
  {
    key: "readiness",
    label: "Operational Readiness",
    icon: Shield,
    getValue: (_t: Tournament, a: TournamentAnalytics) => `${a.readinessScore}`,
    getSub: (_t: Tournament, a: TournamentAnalytics) => `${a.venueUtilization}% venue utilization`,
    color: (_t: Tournament, a: TournamentAnalytics) => a.readinessScore > 80 ? "text-emerald-400" : a.readinessScore > 60 ? "text-amber-400" : "text-red-400",
  },
  {
    key: "risk",
    label: "AI Risk Score",
    icon: AlertTriangle,
    getValue: (_t: Tournament, a: TournamentAnalytics) => `${a.aiRiskScore}`,
    getSub: (_t: Tournament, a: TournamentAnalytics) => `${a.conflictResolutionRate}% conflicts resolved`,
    color: (_t: Tournament, a: TournamentAnalytics) => a.aiRiskScore < 30 ? "text-emerald-400" : a.aiRiskScore < 60 ? "text-amber-400" : "text-red-400",
  },
  {
    key: "efficiency",
    label: "Operational Efficiency",
    icon: TrendingUp,
    getValue: (_t: Tournament, a: TournamentAnalytics) => `${a.operationalEfficiency}%`,
    getSub: (_t: Tournament, a: TournamentAnalytics) => `Avg delay: ${a.averageDelayMinutes} min`,
    color: (_t: Tournament, a: TournamentAnalytics) => a.operationalEfficiency > 80 ? "text-emerald-400" : a.operationalEfficiency > 60 ? "text-amber-400" : "text-red-400",
  },
  {
    key: "safety",
    label: "Safety Index",
    icon: Activity,
    getValue: (_t: Tournament, a: TournamentAnalytics) => `${a.safetyIndex}`,
    getSub: (_t: Tournament, a: TournamentAnalytics) => `${a.totalIncidents} total incidents`,
    color: (_t: Tournament, a: TournamentAnalytics) => a.safetyIndex > 85 ? "text-emerald-400" : a.safetyIndex > 70 ? "text-amber-400" : "text-red-400",
  },
];

export function TournamentStatsCards({ tournament, analytics, className }: TournamentStatsCardsProps) {
  if (!analytics || analytics.totalMatches === undefined) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6", className)}>
        {cards.map((c) => <Card key={c.key}><CardContent className="p-3 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>)}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6", className)}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.label}</span>
                <Icon className={cn("h-3.5 w-3.5", card.color(tournament, analytics))} />
              </div>
              <div className={cn("mt-1 text-lg font-bold", card.color(tournament, analytics))}>
                {card.getValue(tournament, analytics)}
              </div>
              <p className="text-[10px] text-muted-foreground">{card.getSub(tournament, analytics)}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
