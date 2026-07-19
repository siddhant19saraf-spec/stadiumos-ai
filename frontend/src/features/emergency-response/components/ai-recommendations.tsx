"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brain, ArrowRight, Check, AlertTriangle } from "lucide-react";
import type { AIRecommendation } from "../types";
import { useState } from "react";

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
  onApply?: (rec: AIRecommendation) => void;
  className?: string;
}

const priorityColor: Record<string, string> = {
  p0: "bg-red-500/10 text-red-400",
  p1: "bg-orange-500/10 text-orange-400",
  p2: "bg-amber-500/10 text-amber-400",
  p3: "bg-emerald-500/10 text-emerald-400",
};

const priorityLabel: Record<string, string> = { p0: "IMMEDIATE", p1: "HIGH", p2: "MEDIUM", p3: "LOW" };

const categoryLabels: Record<string, string> = {
  dispatch: "Dispatch", evacuation: "Evacuation", communication: "Communication",
  lockdown: "Lockdown", medical: "Medical", engineering: "Engineering",
};

export function AIRecommendations({ recommendations, onApply, className }: AIRecommendationsProps) {
  const [applied, setApplied] = useState<Set<string>>(new Set());

  if (recommendations.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Brain className="h-4 w-4" /> AI Recommendations</CardTitle></CardHeader>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">No active recommendations</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[500px] space-y-3 overflow-y-auto">
        {recommendations.map((rec) => {
          const isApplied = applied.has(rec.id);
          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3 transition-all",
                isApplied && "opacity-50",
              )}
            >
              <div className="mb-1 flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Brain className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                  <div>
                    <span className="text-sm font-medium text-card-foreground">{rec.action}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">{rec.detail}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[9px]", priorityColor[rec.priority])}>
                  {priorityLabel[rec.priority]}
                </Badge>
              </div>
              <div className="mb-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-purple-400">
                  {categoryLabels[rec.category] ?? rec.category}
                </span>
                <span className="flex items-center gap-1"><Brain className="h-3 w-3" />{rec.confidence}% confidence</span>
                {rec.requiresApproval && (
                  <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3 w-3" />Approval required</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium text-card-foreground">Impact:</span> {rec.impact}
                </p>
                {!isApplied && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-[10px]"
                    onClick={() => {
                      setApplied((prev) => new Set(prev).add(rec.id));
                      onApply?.(rec);
                    }}
                  >
                    <Check className="h-3 w-3" />
                    Apply
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
