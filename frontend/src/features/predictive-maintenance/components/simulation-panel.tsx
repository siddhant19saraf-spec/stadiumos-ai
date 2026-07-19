"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Play, TrendingDown, Clock, DollarSign, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ScenarioDefinition, SimulationResult } from "../types";

interface SimulationPanelProps {
  scenarios: ScenarioDefinition[];
  result: SimulationResult | null;
  onRun: (scenarioId: string) => void;
  running?: boolean;
  className?: string;
}

export function SimulationPanel({ scenarios, result, onRun, running, className }: SimulationPanelProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((s) => (
          <Card key={s.id} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-card-foreground">{s.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">
                      {s.category.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{s.description}</p>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                <span>Impact: {s.impactDescription}</span>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                <span>Mitigation: {Math.round(s.mitigationFactor * 100)}% risk reduction</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-7 w-full text-[10px]"
                onClick={() => onRun(s.id)}
                disabled={running}
              >
                <Play className="mr-1 h-3 w-3" />
                {running ? "Simulating..." : "Run Simulation"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {result && (
        <Card className="border-primary/10 bg-gradient-to-br from-background to-emerald-500/[0.03]">
          <CardContent className="p-4">
            <h3 className="mb-3 text-xs font-medium text-card-foreground">
              Simulation Results: {result.scenarioTitle}
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-red-500/5 p-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3 text-red-400" />
                  Predicted Downtime
                </div>
                <p className="text-sm font-bold text-red-400 tabular-nums">
                  {result.predictedDowntime}min
                </p>
              </div>
              <div className="rounded-md bg-emerald-500/5 p-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Mitigated Downtime
                </div>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">
                  {result.mitigatedDowntime}min
                </p>
              </div>
              <div className="rounded-md bg-red-500/5 p-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <DollarSign className="h-3 w-3 text-red-400" />
                  Predicted Cost
                </div>
                <p className="text-sm font-bold text-red-400 tabular-nums">
                  ${result.predictedCostImpact.toLocaleString()}
                </p>
              </div>
              <div className="rounded-md bg-emerald-500/5 p-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TrendingDown className="h-3 w-3 text-emerald-400" />
                  Cost Savings
                </div>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">
                  ${result.costSavings.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Downtime Averted</p>
                <p className="text-xs font-medium tabular-nums">{result.downtimeAverted}min</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Assets in Scope</p>
                <p className="text-xs font-medium tabular-nums">{result.assetsInScope.length}</p>
              </div>
            </div>

            {result.recommendedActions.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">Recommended Actions:</p>
                {result.recommendedActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
