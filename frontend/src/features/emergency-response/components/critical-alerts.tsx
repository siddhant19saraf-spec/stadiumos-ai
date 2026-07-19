"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, CheckCheck, X, Wifi, ShieldAlert, PackageOpen } from "lucide-react";
import type { SmartAlert } from "../types";

interface CriticalAlertsProps {
  alerts: SmartAlert[];
  onAcknowledge?: (id: string) => void;
  className?: string;
}

const alertIcons: Record<string, React.ElementType> = {
  critical_incident: AlertTriangle,
  delayed_response: Bell,
  resource_shortage: PackageOpen,
  high_risk_zone: ShieldAlert,
  escalating_event: AlertTriangle,
  communication_failure: Wifi,
};

const severityBorder: Record<string, string> = {
  critical: "border-l-red-500 bg-red-500/5",
  high: "border-l-orange-500 bg-orange-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-emerald-500 bg-emerald-500/5",
};

const severityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export function CriticalAlerts({ alerts, onAcknowledge, className }: CriticalAlertsProps) {
  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          Critical Alerts
          {unacknowledged.length > 0 && (
            <Badge variant="outline" className="ml-auto bg-red-500/10 text-[10px] text-red-400">
              {unacknowledged.length} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[360px] space-y-2 overflow-y-auto">
        {alerts.length === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/5 p-3 text-sm">
            <CheckCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">All clear — no active alerts</span>
          </div>
        )}
        {alerts.map((alert) => {
          const Icon = alertIcons[alert.type] ?? Bell;
          return (
            <div
              key={alert.id}
              className={cn(
                "rounded-md border-l-4 p-3 transition-all duration-200",
                severityBorder[alert.severity],
                alert.acknowledged && "opacity-50",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", alert.severity === "critical" ? "text-red-400" : alert.severity === "high" ? "text-orange-400" : "text-amber-400")} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-card-foreground">{alert.title}</span>
                      {!alert.acknowledged && <span className={cn("h-2 w-2 rounded-full", severityDot[alert.severity])} />}
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                      {alert.expiresAt && ` · Expires ${new Date(alert.expiresAt).toLocaleTimeString()}`}
                    </p>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => onAcknowledge?.(alert.id)}
                    aria-label="Acknowledge alert"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
