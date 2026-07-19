"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, ArrowRight, Shield } from "lucide-react";
import type { ActiveRisk, RiskLevel } from "../types";

interface CopilotActiveRisksProps {
  risks: ActiveRisk[];
  onSelect?: (risk: ActiveRisk) => void;
  className?: string;
}

const riskLevelConfig: Record<RiskLevel, { color: string; label: string }> = {
  critical: { color: "text-red-400 border-red-500/30 bg-red-500/10", label: "Critical" },
  high: { color: "text-amber-400 border-amber-500/30 bg-amber-500/10", label: "High" },
  medium: { color: "text-blue-400 border-blue-500/30 bg-blue-500/10", label: "Medium" },
  low: { color: "text-muted-foreground border-border bg-muted/50", label: "Low" },
  monitoring: { color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", label: "Monitoring" },
};

export function CopilotActiveRisks({ risks, onSelect, className }: CopilotActiveRisksProps) {
  if (risks.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium"><Shield className="h-4 w-4" /> Active Risks</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No active risks detected</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Active Risks
          </CardTitle>
          <Badge variant="destructive" className="text-[10px]">{risks.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {risks.slice(0, 5).map((risk) => {
          const config = riskLevelConfig[risk.level];
          return (
            <button
              key={risk.id}
              onClick={() => onSelect?.(risk)}
              className={cn(
                "w-full rounded-lg border p-2.5 text-left transition-all hover:bg-accent/50",
                risk.level === "critical" ? "border-red-500/20" : "border-border",
              )}
              aria-label={`Risk: ${risk.title}, Level: ${risk.level}, Location: ${risk.location}`}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-foreground">{risk.title}</span>
                <Badge variant="outline" className={cn("shrink-0 text-[9px] px-1.5", config.color)}>{config.label}</Badge>
              </div>
              <p className="mb-1.5 text-[11px] text-muted-foreground">{risk.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                {risk.location && <span>📍 {risk.location}</span>}
                <span>🎯 {risk.probability}% probability</span>
                <span className="flex items-center gap-0.5">
                  {risk.trend === "increasing" ? <TrendingUp className="h-3 w-3 text-red-400" /> : risk.trend === "decreasing" ? <TrendingDown className="h-3 w-3 text-emerald-400" /> : <Minus className="h-3 w-3 text-muted-foreground" />}
                  {risk.trend}
                </span>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

