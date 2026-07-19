"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Clock, AlertTriangle, Target, ArrowRight } from "lucide-react";
import type { PredictedProblem, Priority } from "../types";

interface CopilotPredictedProblemsProps {
  problems: PredictedProblem[];
  onAction?: (problem: PredictedProblem) => void;
  onQuery?: (problem: PredictedProblem) => void;
  className?: string;
}

const severityConfig: Record<Priority, { color: string }> = {
  critical: { color: "text-red-400 border-red-500/30 bg-red-500/10" },
  high: { color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  medium: { color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  low: { color: "text-muted-foreground border-border bg-muted/50" },
};

export function CopilotPredictedProblems({
  problems,
  onAction,
  onQuery,
  className,
}: CopilotPredictedProblemsProps) {
  if (problems.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium"><Brain className="h-4 w-4" /> Predicted Problems</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No problems predicted. All systems nominal.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Brain className="h-4 w-4 text-purple-400" aria-hidden="true" />
            Predicted Problems
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">{problems.length} predictions</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {problems.map((problem) => {
          const config = severityConfig[problem.severity];
          return (
            <div
              key={problem.id}
              className={cn(
                "rounded-lg border p-3",
                problem.severity === "critical" ? "border-red-500/20 bg-red-500/[0.02]" : "border-border",
              )}
            >
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", config.color)} aria-hidden="true" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{problem.title}</p>
                    <p className="text-[11px] text-muted-foreground">{problem.detail}</p>
                  </div>
                </div>
              </div>

              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="gap-1 text-[9px] px-1.5 py-0">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {problem.timeToOccur}
                </Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  🎯 {problem.probability}%
                </Badge>
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", config.color)}>
                  {problem.severity}
                </Badge>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {problem.affectedArea}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Target className="h-3 w-3 text-blue-400" aria-hidden="true" />
                  {problem.recommendedAction}
                </div>
                <div className="flex gap-1">
                  {onAction && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-6 text-[10px] px-2"
                      onClick={() => onAction(problem)}
                      aria-label={`Apply action for ${problem.title}`}
                    >
                      Apply
                    </Button>
                  )}
                  {onQuery && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => onQuery(problem)}
                      aria-label={`Ask about ${problem.title}`}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
