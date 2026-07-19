"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, CheckCircle2, Clock, MapPin, X } from "lucide-react";
import type { ParkingAlert } from "../types";

interface AlertPanelProps {
  alerts: ParkingAlert[];
  onAcknowledge: (id: string) => void;
  className?: string;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/20 text-red-400",
  high: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  medium: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  low: "bg-blue-500/10 border-blue-500/20 text-blue-400",
};

export function AlertPanel({ alerts, onAcknowledge, className }: AlertPanelProps) {
  const sorted = [...alerts]
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    });

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Alerts</span>
          <div className="flex items-center gap-1.5">
            {alerts.filter((a) => a.severity === "critical" || a.severity === "high").length > 0 && (
              <Badge className="bg-red-500/10 text-[10px] text-red-400">
                <AlertCircle className="mr-1 h-2.5 w-2.5" />
                {alerts.filter((a) => (a.severity === "critical" || a.severity === "high") && !a.acknowledged).length} critical
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">{alerts.length} total</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
            No active alerts
          </div>
        ) : (
          sorted.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-md border p-2.5 transition-all",
                severityColors[alert.severity] ?? "border-muted bg-muted/20",
                alert.acknowledged && "opacity-50",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  {alert.severity === "critical" || alert.severity === "high" ? (
                    <AlertCircle className="h-3 w-3 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                  )}
                  {alert.title}
                </span>
                <div className="flex items-center gap-1">
                  <span className="rounded bg-background/60 px-1.5 py-0.5 text-[8px] font-medium uppercase">
                    {alert.severity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => onAcknowledge(alert.id)}
                    disabled={alert.acknowledged}
                    aria-label={alert.acknowledged ? "Already acknowledged" : `Acknowledge alert: ${alert.title}`}
                  >
                    {alert.acknowledged ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="mb-1 text-[10px] leading-relaxed text-muted-foreground">{alert.description}</p>
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {alert.locationName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
