"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lightbulb, ArrowUpRight, CheckCircle2, Brain } from "lucide-react";
import type { ParkingRecommendation } from "../types";

interface RecommendationPanelProps {
  recommendations: ParkingRecommendation[];
  onAcknowledge?: (id: string) => void;
  className?: string;
}

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/10 border-red-500/20 text-red-400",
  high: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  medium: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  low: "bg-blue-500/10 border-blue-500/20 text-blue-400",
};

const priorityLabels: Record<string, string> = {
  urgent: "Immediate", high: "Priority", medium: "Standard", low: "Info",
};

export function RecommendationPanel({ recommendations, onAcknowledge, className }: RecommendationPanelProps) {
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
      <CardContent className="space-y-2">
        {recommendations.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">All systems nominal — no recommendations</p>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.id} className={cn("rounded-md border p-3", priorityColors[rec.priority] ?? "border-muted bg-muted/20")}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                  {rec.action}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-background/60 px-1.5 py-0.5 text-[8px] font-medium uppercase">
                    {priorityLabels[rec.priority] ?? rec.priority}
                  </span>
                  {onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(rec.id)}
                      className="text-muted-foreground hover:text-emerald-400 transition-colors"
                      aria-label={`Acknowledge ${rec.action}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mb-1 text-[10px] leading-relaxed text-muted-foreground">{rec.detail}</p>
              <div className="mb-1.5 flex flex-wrap gap-1">
                {rec.reasoning.map((r, i) => (
                  <span key={i} className="rounded bg-background/40 px-1.5 py-0.5 text-[8px] text-muted-foreground">
                    {r}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span>{rec.locationName}</span>
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="h-2.5 w-2.5" />
                  Impact: {rec.impact}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
