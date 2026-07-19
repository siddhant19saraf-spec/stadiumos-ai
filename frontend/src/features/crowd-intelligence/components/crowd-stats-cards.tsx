"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Users, Activity, AlertTriangle, Shield, Thermometer } from "lucide-react";
import type { CrowdAnalytics } from "../types";

interface CrowdStatsCardsProps {
  analytics: CrowdAnalytics;
  className?: string;
  isRefreshing?: boolean;
}

function TrendIcon({ value, good, bad }: { value: number; good: "up" | "down"; bad: "up" | "down" }) {
  const isGood = good === "up" ? value > 50 : value < 50;
  if (Math.abs(value - 50) < 5) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (isGood) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  return <TrendingDown className="h-4 w-4 text-red-400" />;
}

const statCards = [
  {
    key: "occupancy",
    label: "Current Occupancy",
    icon: Users,
    getValue: (a: CrowdAnalytics) => `${((a.currentOccupancy ?? 0) / 1000).toFixed(1)}K`,
    getSub: (a: CrowdAnalytics) => `${a.capacityPercent.toFixed(0)}% capacity used`,
    trend: (a: CrowdAnalytics) => a.capacityPercent > 80 ? "high" : a.capacityPercent > 50 ? "moderate" : "low",
    goodDirection: "down" as const,
  },
  {
    key: "congestion",
    label: "Congestion Level",
    icon: Activity,
    getValue: (a: CrowdAnalytics) => `${a.congestionScore.toFixed(0)}`,
    getSub: (a: CrowdAnalytics) => a.congestionScore > 60 ? "Elevated" : a.congestionScore > 30 ? "Moderate" : "Low",
    trend: (a: CrowdAnalytics) => a.congestionScore > 60 ? "high" : a.congestionScore > 30 ? "moderate" : "low",
    goodDirection: "down" as const,
  },
  {
    key: "safety",
    label: "Safety Index",
    icon: Shield,
    getValue: (a: CrowdAnalytics) => `${a.safetyIndex.toFixed(0)}`,
    getSub: (a: CrowdAnalytics) => `${a.riskScore.toFixed(0)} risk score`,
    trend: (a: CrowdAnalytics) => a.safetyIndex > 80 ? "good" : a.safetyIndex > 60 ? "moderate" : "poor",
    goodDirection: "up" as const,
  },
  {
    key: "heat",
    label: "Heat Index",
    icon: Thermometer,
    getValue: (a: CrowdAnalytics) => `${a.heatIndex.toFixed(0)}`,
    getSub: (a: CrowdAnalytics) => a.heatIndex > 70 ? "Monitor zones" : "Normal",
    trend: (a: CrowdAnalytics) => a.heatIndex > 70 ? "high" : a.heatIndex > 40 ? "moderate" : "low",
    goodDirection: "down" as const,
  },
];

export function CrowdStatsCards({ analytics, className, isRefreshing }: CrowdStatsCardsProps) {
  if (!analytics || !analytics.currentOccupancy) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          No analytics data available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 xl:grid-cols-4", className)}>
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = card.getValue(analytics);
        const sub = card.getSub(analytics);
        const trendValue = card.key === "occupancy" ? analytics.capacityPercent : card.key === "congestion" ? analytics.congestionScore : card.key === "safety" ? analytics.safetyIndex : analytics.heatIndex;
        return (
          <Card key={card.key} className={cn("transition-all duration-200", isRefreshing && "opacity-70")}>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-card-foreground">{value}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendIcon value={trendValue} good={card.goodDirection === "up" ? "up" : "down"} bad={card.goodDirection === "up" ? "down" : "up"} />
                {sub}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

