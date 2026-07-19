"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lightbulb, ArrowRight, Clock, Target } from "lucide-react";
import type { CrowdRecommendation } from "../types";

interface RecommendationPanelProps {
  recommendations: CrowdRecommendation[];
  className?: string;
}

const priorityColor: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400",
  high: "bg-orange-500/10 text-orange-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-emerald-500/10 text-emerald-400",
};

export function RecommendationPanel({ recommendations, className }: RecommendationPanelProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lightbulb className="h-4 w-4" /> Recommendations</CardTitle></CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">No recommendations at this time</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4" />
          Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => (
          <div key={rec.id} className="rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3">
            <div className="mb-1 flex items-start justify-between">
              <span className="text-sm font-medium text-card-foreground">{rec.action}</span>
              <Badge variant="outline" className={cn("text-[10px]", priorityColor[rec.priority])}>
                {rec.priority}
              </Badge>
            </div>
            <div className="mb-2 text-xs text-muted-foreground">
              <span className="font-medium text-card-foreground">Location:</span> {rec.location}<br />
              <span className="font-medium text-card-foreground">Why:</span> {rec.reason}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {rec.confidence}% confidence
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {rec.implementationTime}
              </span>
            </div>
            <div className="mt-1.5 flex items-start gap-1.5 rounded bg-primary/5 px-2 py-1.5 text-xs">
              <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              <span className="text-card-foreground">{rec.expectedImpact}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
