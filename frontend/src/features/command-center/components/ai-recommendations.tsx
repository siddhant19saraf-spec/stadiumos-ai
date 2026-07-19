"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle2, XCircle, Timer, Target, AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { AIRecommendation, RecommendationPriority } from "../types";

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
  className?: string;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const priorityConfig: Record<RecommendationPriority, { label: string; color: string; icon: typeof AlertTriangle }> = {
  critical: { label: "Critical", color: "text-red-400 border-red-500/30 bg-red-500/10", icon: AlertCircle },
  high: { label: "High", color: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: AlertTriangle },
  medium: { label: "Medium", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: Info },
  low: { label: "Low", color: "text-muted-foreground border-border bg-muted/50", icon: Info },
};

const categoryLabels: Record<string, string> = {
  crowd: "Crowd",
  security: "Security",
  parking: "Parking",
  staff: "Staff",
  energy: "Energy",
  operations: "Ops",
};

export function AIRecommendations({
  recommendations,
  className,
  onApply,
  onDismiss,
}: AIRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-amber-400" aria-hidden="true" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active recommendations. All systems nominal.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="h-4 w-4 text-amber-400" aria-hidden="true" />
          AI Recommendations
          <Badge variant="secondary" className="ml-auto text-xs">
            {recommendations.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.map((rec) => {
          const config = priorityConfig[rec.priority];
          const PriorityIcon = config.icon;

          return (
            <div
              key={rec.id}
              className={cn(
                "group rounded-lg border p-3 transition-all duration-200 hover:shadow-sm",
                rec.priority === "critical"
                  ? "border-red-500/20 bg-red-500/[0.02]"
                  : "border-border bg-card",
              )}
              role="listitem"
              aria-label={`Recommendation: ${rec.action}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <PriorityIcon className={cn("mt-0.5 h-4 w-4 shrink-0", config.color)} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium leading-tight text-foreground">{rec.action}</p>
                    {rec.location && (
                      <p className="text-xs text-muted-foreground">{rec.location}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cn("shrink-0 text-[10px]", config.color)}>
                  {config.label}
                </Badge>
              </div>

              <p className="mb-2 text-xs text-muted-foreground">{rec.reason}</p>

              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Target className="h-3 w-3" aria-hidden="true" />
                  {rec.expectedImpact}
                </Badge>
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Timer className="h-3 w-3" aria-hidden="true" />
                  {rec.estimatedResolutionMinutes}m
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {categoryLabels[rec.category] ?? rec.category}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {rec.confidence}% confidence
                </Badge>
              </div>

              <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={() => onApply?.(rec.id)}
                  aria-label={`Apply recommendation: ${rec.action}`}
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => onDismiss?.(rec.id)}
                  aria-label={`Dismiss recommendation: ${rec.action}`}
                >
                  <XCircle className="mr-1 h-3 w-3" aria-hidden="true" />
                  Dismiss
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

