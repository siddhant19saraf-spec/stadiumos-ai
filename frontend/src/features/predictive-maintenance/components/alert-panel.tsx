"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, Brain, CheckCircle2, Eye, Shield, Wrench } from "lucide-react";
import type { Alert } from "../types";

interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  className?: string;
}

const severityStyles: Record<string, string> = {
  critical: "border-l-red-500",
  severe: "border-l-orange-500",
  warning: "border-l-amber-500",
  info: "border-l-blue-500",
};

const severityBadge: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  severe: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const categoryIcons: Record<string, typeof Bell> = {
  failure_risk: AlertTriangle,
  environmental: Shield,
  safety: Eye,
  operational: Wrench,
  maintenance_due: Wrench,
  system: Brain,
};

export function AlertPanel({ alerts, onAcknowledge, className }: AlertPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
        No active alerts
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {alerts.map((alert) => {
        const Icon = categoryIcons[alert.category] ?? Bell;
        return (
          <Card
            key={alert.id}
            className={cn(
              "border-l-4 border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]",
              severityStyles[alert.severity],
              alert.acknowledged && "opacity-60",
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", alert.severity === "critical" || alert.severity === "severe" ? "text-red-400" : "text-amber-400")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-card-foreground">{alert.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", severityBadge[alert.severity])}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">
                        {alert.category.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{alert.assetName}</p>
                  </div>
                </div>
                {!alert.acknowledged && onAcknowledge && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 text-[10px]"
                    onClick={(e) => { e.stopPropagation(); onAcknowledge(alert.id); }}
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Ack
                  </Button>
                )}
              </div>

              <p className="mt-1.5 text-[10px] text-muted-foreground">{alert.message}</p>

              {alert.suggestedAction && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded bg-primary/5 px-2 py-1">
                  <Brain className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <span className="text-[10px] text-muted-foreground">{alert.suggestedAction}</span>
                </div>
              )}

              {alert.requiresImmediateAction && (
                <div className="mt-1.5 flex items-center gap-1 rounded bg-red-500/5 px-2 py-1 text-[10px] text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  Immediate action required
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
