"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brain, Lightbulb, Check, AlertTriangle } from "lucide-react";
import type { AIRecommendation } from "../types";

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
  onApply?: (id: string) => void;
  className?: string;
}

const priorityColor: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400",
  high: "bg-orange-500/10 text-orange-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-emerald-500/10 text-emerald-400",
};
const typeLabels: Record<string, string> = {
  reschedule: "Reschedule", relocate: "Relocate", increase_security: "Security",
  delay_kickoff: "Delay", allocate_staff: "Staff Allocation",
  activate_backup: "Backup Plan", weather_action: "Weather",
  schedule_optimization: "Optimization",
};

export function AIRecommendations({ recommendations, onApply, className }: AIRecommendationsProps) {
  const [applied, setApplied] = useState<Set<string>>(new Set());

  if (recommendations.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Brain className="h-4 w-4" /> AI Recommendations</CardTitle></CardHeader>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">All recommendations implemented</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4 text-amber-400" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[500px] space-y-3 overflow-y-auto">
        {recommendations.map((rec) => {
          const isApplied = applied.has(rec.id) || rec.implemented;
          return (
            <div key={rec.id} className={cn("rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3 transition-all", isApplied && "opacity-50")}>
              <div className="mb-1 flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Brain className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                  <div>
                    <span className="text-sm font-medium text-card-foreground">{rec.title}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[9px]", priorityColor[rec.priority])}>
                  {rec.priority.toUpperCase()}
                </Badge>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-purple-400">
                  {typeLabels[rec.type] ?? rec.type}
                </span>
                <span><Brain className="mr-0.5 inline h-3 w-3" />{rec.confidence}% conf</span>
                {rec.requiresApproval && (
                  <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3 w-3" />Approval required</span>
                )}
              </div>
              <div className="mb-2 space-y-0.5">
                {rec.reasoning.slice(0, 2).map((r, i) => (
                  <p key={i} className="text-[9px] text-muted-foreground">· {r}</p>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium text-card-foreground">Impact:</span> {rec.impact}
                </p>
                {!isApplied && (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => { setApplied((prev) => new Set(prev).add(rec.id)); onApply?.(rec.id); }}>
                    <Check className="h-3 w-3" /> Apply
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
