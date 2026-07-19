"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Users, Activity, AlertTriangle, Car, Clock, UsersRound, Zap, DollarSign, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { KPIMetric } from "../types";

interface KPICardGridProps {
  metrics: KPIMetric[];
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  Activity,
  AlertTriangle,
  Car,
  Clock,
  UsersRound,
  Zap,
  DollarSign,
  Heart,
};

function formatMetricValue(value: number, unit: string): string {
  if (unit === "$") return `$${(value / 1000).toFixed(0)}K`;
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "people") return `${(value / 1000).toFixed(0)}K`;
  if (unit === "min") return `${value.toFixed(0)}m`;
  if (unit === "kWh") return `${value.toFixed(0)}`;
  if (unit === "/5") return value.toFixed(1);
  if (unit === "active") return value.toFixed(0);
  return `${value.toFixed(0)}${unit}`;
}

function KPICard({ metric }: { metric: KPIMetric }) {
  const Icon = iconMap[metric.icon] ?? Activity;
  const isPositive = metric.changeType === "increase" && !["emergency-alerts", "crowd-density", "avg-queue-time", "parking-usage", "energy-consumption"].includes(metric.id);
  const isNegative = metric.changeType === "increase" && ["emergency-alerts", "crowd-density", "avg-queue-time", "parking-usage", "energy-consumption"].includes(metric.id);
  const trendColor = metric.changeType === "neutral" ? "text-muted-foreground" : isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : metric.changeType === "increase" ? "text-emerald-400" : "text-red-400";

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
      <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-primary/[0.03]" aria-hidden="true" />
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
        </div>
        <div className="mb-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {formatMetricValue(metric.value, metric.unit)}
          </span>
          <span className="text-xs text-muted-foreground">{metric.unit}</span>
        </div>
        <div className="flex items-center gap-1">
          {metric.changeType !== "neutral" ? (
            metric.changeType === "increase" ? (
              <TrendingUp className={cn("h-3 w-3", trendColor)} aria-hidden="true" />
            ) : (
              <TrendingDown className={cn("h-3 w-3", trendColor)} aria-hidden="true" />
            )
          ) : (
            <Minus className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          )}
          <span className={cn("text-xs tabular-nums", trendColor)}>
            {metric.change > 0 ? "+" : ""}{metric.change.toFixed(1)}%
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground">vs avg</span>
        </div>
        {metric.trend.length > 1 && (
          <div className="mt-2 flex items-end gap-[2px]" aria-hidden="true">
            {metric.trend.slice(-20).map((val, i) => (
              <div
                key={i}
                className="h-8 flex-1 rounded-sm bg-primary/10"
                style={{
                  height: `${(val / Math.max(...metric.trend)) * 24}px`,
                  opacity: 0.3 + (i / metric.trend.slice(-20).length) * 0.7,
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KPICardGrid({ metrics, className }: KPICardGridProps) {
  if (metrics.length === 0) {
    return (
      <div className={cn("flex items-center justify-center rounded-lg border border-dashed p-8", className)} role="status">
        <p className="text-sm text-muted-foreground">No metrics available</p>
      </div>
    );
  }

  return (
    <div
      className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5", className)}
      role="region"
      aria-label="Key performance indicators"
    >
      {metrics.map((metric) => (
        <KPICard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
