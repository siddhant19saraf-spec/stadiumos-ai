"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, AlertTriangle, Wrench, Shield } from "lucide-react";

interface HealthSummaryCardsProps {
  totalAssets: number;
  averageHealthScore: number;
  criticalAssets: number;
  highRiskAssets: number;
  openWorkOrders: number;
  className?: string;
}

export function HealthSummaryCards({
  totalAssets,
  averageHealthScore,
  criticalAssets,
  highRiskAssets,
  openWorkOrders,
  className,
}: HealthSummaryCardsProps) {
  const healthColor = averageHealthScore >= 70 ? "text-emerald-400" : averageHealthScore >= 45 ? "text-amber-400" : "text-red-400";

  const cards = [
    {
      label: "Total Assets",
      value: totalAssets,
      icon: Activity,
      sub: "Monitored assets",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Avg Health Score",
      value: `${averageHealthScore}%`,
      icon: Shield,
      sub: "Fleet average",
      color: healthColor,
      bg: "bg-emerald-500/10",
    },
    {
      label: "Critical Risk",
      value: highRiskAssets,
      icon: AlertTriangle,
      sub: `${criticalAssets} in critical status`,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Open Work Orders",
      value: openWorkOrders,
      icon: Wrench,
      sub: "Requires action",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {cards.map((card) => (
        <Card key={card.label} className="border-primary/10 bg-gradient-to-br from-background to-primary/5">
          <CardContent className="flex items-start gap-3 p-4">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", card.bg)}>
              <card.icon className={cn("h-5 w-5", card.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={cn("text-xl font-bold tabular-nums", card.color)}>{card.value}</p>
              <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
