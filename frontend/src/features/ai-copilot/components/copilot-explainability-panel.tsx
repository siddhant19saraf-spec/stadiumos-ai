"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle2, Target, ArrowRight, BarChart3, List } from "lucide-react";
import type { AIReasoning, Priority } from "../types";

interface CopilotExplainabilityPanelProps {
  reasoning: AIReasoning;
  className?: string;
}

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  critical: { label: "Critical", color: "text-red-400" },
  high: { label: "High", color: "text-amber-400" },
  medium: { label: "Medium", color: "text-blue-400" },
  low: { label: "Low", color: "text-muted-foreground" },
};

export function CopilotExplainabilityPanel({ reasoning, className }: CopilotExplainabilityPanelProps) {
  const pConfig = priorityConfig[reasoning.priority];

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Brain className="h-4 w-4 text-purple-400" aria-hidden="true" />
          AI Reasoning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Confidence Gauge */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confidence Score</span>
            <span className={cn("font-semibold tabular-nums", reasoning.confidence >= 90 ? "text-emerald-400" : reasoning.confidence >= 75 ? "text-amber-400" : "text-red-400")}>
              {reasoning.confidence}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                reasoning.confidence >= 90 ? "bg-emerald-400" : reasoning.confidence >= 75 ? "bg-amber-400" : "bg-red-400",
              )}
              style={{ width: `${reasoning.confidence}%` }}
            />
          </div>
        </div>

        {/* Summary */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
          <p className="text-xs leading-relaxed text-foreground/85">{reasoning.summary}</p>
        </div>

        {/* Evidence */}
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <List className="h-3 w-3" aria-hidden="true" />
            Evidence
          </p>
          <ul className="space-y-1">
            {reasoning.evidence.map((ev, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
                {ev}
              </li>
            ))}
          </ul>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Priority:</span>
          <Badge variant="outline" className={cn("text-[10px]", pConfig.color)}>
            {pConfig.label}
          </Badge>
        </div>

        {/* Action */}
        <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recommended Action</p>
              <p className="text-xs font-medium text-foreground">{reasoning.recommendedAction}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
          <div className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expected Outcome</p>
              <p className="text-xs font-medium text-foreground">{reasoning.expectedOutcome}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
