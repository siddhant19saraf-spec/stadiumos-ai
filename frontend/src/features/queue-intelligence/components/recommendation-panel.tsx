"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lightbulb, Brain, TrendingUp } from "lucide-react";
import type { QueueRecommendation } from "../types";

interface RecommendationPanelProps {
  recommendations: QueueRecommendation[];
  className?: string;
}

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/10 border-red-500/20 text-red-400",
  high: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  medium: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  low: "bg-blue-500/10 border-blue-500/20 text-blue-400",
};

export function RecommendationPanel({ recommendations, className }: RecommendationPanelProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>AI Recommendations</span>
          <Badge variant="outline" className="bg-primary/10 text-[10px] text-primary">
            <Brain className="mr-1 h-2.5 w-2.5" />{recommendations.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
        {recommendations.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">All systems nominal</p>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.id} className={cn("rounded-md border p-3", priorityColors[rec.priority] ?? "border-muted bg-muted/20")}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                  {rec.action}
                </span>
                <span className="rounded bg-background/60 px-1.5 py-0.5 text-[8px] font-medium uppercase">
                  {rec.priority}
                </span>
              </div>
              <p className="mb-2 text-[10px] leading-relaxed text-muted-foreground">{rec.detail}</p>

              <div className="mb-2 space-y-1">
                <p className="flex items-center gap-1 text-[9px] font-medium text-card-foreground">
                  <Brain className="h-2.5 w-2.5" /> Reasoning
                </p>
                <ul className="space-y-0.5">
                  {rec.reasoning.map((r, i) => (
                    <li key={i} className="flex items-start gap-1 text-[9px] text-muted-foreground">
                      <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-2 space-y-1">
                <p className="flex items-center gap-1 text-[9px] font-medium text-card-foreground">
                  <TrendingUp className="h-2.5 w-2.5" /> Contributing Factors
                </p>
                <div className="flex flex-wrap gap-1">
                  {rec.contributingFactors.map((f, i) => (
                    <span key={i} className="rounded bg-background/40 px-1.5 py-0.5 text-[8px] text-muted-foreground">{f}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-md bg-background/30 p-2">
                <div>
                  <p className="text-[8px] text-muted-foreground">Impact</p>
                  <p className="text-[9px] font-medium text-card-foreground">{rec.operationalImpact}</p>
                </div>
                <div>
                  <p className="text-[8px] text-muted-foreground">Improvement</p>
                  <p className="text-[9px] font-medium text-emerald-400">{rec.estimatedImprovement}</p>
                </div>
                <div>
                  <p className="text-[8px] text-muted-foreground">Confidence</p>
                  <p className="text-[9px] font-medium text-card-foreground">{rec.confidence}%</p>
                </div>
                <div>
                  <p className="text-[8px] text-muted-foreground">Location</p>
                  <p className="text-[9px] font-medium text-card-foreground truncate">{rec.locationName}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
