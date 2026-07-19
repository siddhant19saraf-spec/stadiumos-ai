"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, Timer, Gauge, DollarSign, Smile, ShoppingBag, Users, TrendingDown, BarChart3 } from "lucide-react";
import type { ConcessionAnalytics } from "../types";

interface AnalyticsPanelProps {
  analytics: ConcessionAnalytics;
  className?: string;
}

const scoreColor = (v: number) =>
  v >= 75 ? "text-emerald-400" : v >= 50 ? "text-amber-400" : "text-red-400";

export function AnalyticsPanel({ analytics, className }: AnalyticsPanelProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Executive Analytics</span>
          <Badge variant="outline" className={cn("text-[10px]", scoreColor(analytics.aiOptimizationScore))}>
            AI Opt: {analytics.aiOptimizationScore}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AnalyticCard icon={Timer} label="Avg Wait Time" value={`${analytics.avgServiceTimeSec} sec`} desc="Service speed" color="text-blue-400" />
          <AnalyticCard icon={TrendingUp} label="Queue Trend" value={analytics.totalCustomersServed.toLocaleString()} desc="Customers served" color="text-purple-400" />
          <AnalyticCard icon={Gauge} label="Service Efficiency" value={`${analytics.operationalEfficiency}`} desc="Score (0-100)" color={scoreColor(analytics.operationalEfficiency)} />
          <AnalyticCard icon={DollarSign} label="Revenue" value={`$${analytics.totalSales.toLocaleString()}`} desc={`$${analytics.revenuePerMin}/min`} color="text-emerald-400" />
          <AnalyticCard icon={Smile} label="Satisfaction" value={`${analytics.customerSatisfactionAvg}/5`} desc="Customer avg" color={analytics.customerSatisfactionAvg >= 4 ? "text-emerald-400" : analytics.customerSatisfactionAvg >= 3 ? "text-amber-400" : "text-red-400"} />
          <AnalyticCard icon={ShoppingBag} label="Popular Category" value={analytics.popularCategory} desc={`Revenue: $${analytics.revenueForecast.toLocaleString()}`} color="text-pink-400" />
          <AnalyticCard icon={Users} label="Staff Utilization" value={`${analytics.staffUtilization}%`} desc="Active counters" color={analytics.staffUtilization > 80 ? "text-emerald-400" : analytics.staffUtilization > 60 ? "text-amber-400" : "text-red-400"} />
          <AnalyticCard icon={TrendingDown} label="Waste Reduction" value={`${analytics.wasteReductionPercent}%`} desc="Reduction achieved" color="text-emerald-400" />
        </div>

        <div className="rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              AI Optimization Score
            </span>
            <span className={cn("text-lg font-bold", scoreColor(analytics.aiOptimizationScore))}>
              {analytics.aiOptimizationScore}/100
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-[10px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Peak Hour</span><span className="font-medium text-card-foreground">{analytics.peakHour}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Revenue Forecast</span><span className="font-medium text-card-foreground">${analytics.revenueForecast.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Operational Efficiency</span><span className="font-medium text-card-foreground">{analytics.operationalEfficiency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Staff Utilization</span><span className="font-medium text-card-foreground">{analytics.staffUtilization}%</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticCard({ icon: Icon, label, value, desc, color }: { icon: React.ElementType; label: string; value: string; desc: string; color: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className={cn("text-sm font-semibold", color)}>{value}</p>
      <p className="text-[9px] text-muted-foreground">{desc}</p>
    </div>
  );
}
