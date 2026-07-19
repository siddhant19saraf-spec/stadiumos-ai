"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Shield, Gauge, Heart, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import type { OperationalSummary } from "../types";

interface CopilotOperationalSummaryProps {
  summary: OperationalSummary;
  className?: string;
}

export function CopilotOperationalSummary({ summary, className }: CopilotOperationalSummaryProps) {
  const statusConfig = {
    healthy: { label: "All Systems Nominal", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", icon: CheckCircle2 },
    moderate: { label: "Requires Attention", color: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: AlertTriangle },
    critical: { label: "Critical Attention", color: "text-red-400 border-red-500/30 bg-red-500/10", icon: AlertCircle },
  };

  const status = statusConfig[summary.overallStatus];
  const StatusIcon = status.icon;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Operational Summary
          </CardTitle>
          <Badge variant="outline" className={cn("gap-1 text-xs", status.color)}>
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricItem icon={Users} label="Total Visitors" value={summary.totalVisitors.toLocaleString()} />
          <MetricItem icon={Gauge} label="Capacity Used" value={`${summary.capacityUsed}%`} />
          <MetricItem icon={Shield} label="Active Incidents" value={String(summary.activeIncidents)} valueColor={summary.activeIncidents > 0 ? "text-red-400" : "text-emerald-400"} />
          <MetricItem icon={Heart} label="Staff On Duty" value={String(summary.staffOnDuty)} />
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Key Highlights</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.highlights.map((h, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                {h}
              </Badge>
            ))}
          </div>
        </div>

        <p className="mt-2 text-[10px] text-muted-foreground">
          Updated: {new Date(summary.lastUpdated).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}

function MetricItem({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </div>
      <p className={cn("text-sm font-semibold tracking-tight", valueColor ?? "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

