"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, X, Bell, CheckCheck } from "lucide-react";
import type { CrowdAlert } from "../types";

interface AlertBannerProps {
  alerts: CrowdAlert[];
  onDismiss?: (id: string) => void;
  className?: string;
}

const severityConfig = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertTriangle, text: "text-red-400" },
  high: { bg: "bg-orange-500/10", border: "border-orange-500/30", icon: AlertTriangle, text: "text-orange-400" },
  medium: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: Bell, text: "text-amber-400" },
  low: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: Bell, text: "text-emerald-400" },
};

export function AlertBanner({ alerts, onDismiss, className }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) {
    return (
      <Card className={cn("border-emerald-500/30 bg-emerald-500/5", className)}>
        <CardContent className="flex items-center gap-2 p-3 text-sm">
          <CheckCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-emerald-400">All clear — no active alerts</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {visible.map((alert) => {
        const cfg = severityConfig[alert.severity] ?? severityConfig.medium;
        const Icon = cfg.icon;
        return (
          <Card key={alert.id} className={cn("border", cfg.border, cfg.bg)}>
            <CardContent className="flex items-start gap-3 p-3">
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", cfg.text)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", cfg.text)}>{alert.title}</span>
                  <span className="text-[10px] capitalize text-muted-foreground">({alert.severity})</span>
                </div>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {alert.zone} · {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => {
                  setDismissed((prev) => new Set(prev).add(alert.id));
                  onDismiss?.(alert.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
