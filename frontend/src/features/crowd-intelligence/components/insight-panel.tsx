// @ts-nocheck
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Brain, AlertTriangle, TrendingUp, Info, Lightbulb, Eye } from "lucide-react";
import type { AIInsight } from "../types";

interface InsightPanelProps {
  insights: AIInsight[];
  className?: string;
}

const typeConfig = {
  warning: { icon: AlertTriangle, bg: "bg-orange-500/10", text: "text-orange-400", label: "Warning" },
  prediction: { icon: TrendingUp, bg: "bg-blue-500/10", text: "text-blue-400", label: "Prediction" },
  recommendation: { icon: Lightbulb, bg: "bg-purple-500/10", text: "text-purple-400", label: "Suggestion" },
  observation: { icon: Eye, bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Insight" },
};

export function InsightPanel({ insights, className }: InsightPanelProps) {
  if (!insights || insights.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Brain className="h-4 w-4" /> AI Insights</CardTitle></CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">No AI insights generated yet</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const cfg = typeConfig[insight.type] ?? typeConfig.observation;
          const Icon = cfg.icon;
          return (
            <div key={insight.id} className="rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3">
              <div className="mb-1 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("mt-0.5 h-4 w-4", cfg.text)} />
                  <span className="text-sm font-medium text-card-foreground">{insight.title}</span>
                </div>
                <Badge variant="outline" className={cn("text-[10px]", cfg.bg, cfg.text)}>
                  {cfg.label}
                </Badge>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{insight.detail}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  {insight.confidence}% confidence
                </span>
                <span>{new Date(insight.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

