"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: string;
  bg?: string;
  className?: string;
}

const trendIcons: Record<string, string> = {
  up: "↑",
  down: "↓",
  neutral: "→",
};
const trendColors: Record<string, string> = {
  up: "text-emerald-400",
  down: "text-red-400",
  neutral: "text-muted-foreground",
};

export function KpiCard({ label, value, sub, icon: Icon, trend, color = "text-primary", bg = "bg-primary/10", className }: KpiCardProps) {
  return (
    <Card className={cn("border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]", className)}>
      <CardContent className="flex items-start gap-3 p-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <p className={cn("text-lg font-bold tabular-nums", color)}>{value}</p>
            {trend && (
              <span className={cn("text-[10px]", trendColors[trend])}>
                {trendIcons[trend]}
              </span>
            )}
          </div>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
