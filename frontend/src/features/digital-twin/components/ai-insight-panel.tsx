"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lightbulb, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import type { AIInsight } from "../types";

interface AIInsightPanelProps {
  insights: AIInsight[];
  className?: string;
}

const insightIcons: Record<string, React.ElementType> = {
  warning: AlertTriangle,
  prediction: TrendingUp,
  recommendation: Lightbulb,
  observation: Shield,
};

const insightColors: Record<string, string> = {
  warning: "text-amber-400 border-amber-500/20 bg-amber-500/5",
  prediction: "text-blue-400 border-blue-500/20 bg-blue-500/5",
  recommendation: "text-purple-400 border-purple-500/20 bg-purple-500/5",
  observation: "text-muted-foreground border-muted bg-muted/20",
};

export function AIInsightPanel({ insights, className }: AIInsightPanelProps) {
  const displayed = insights.slice(0, 6);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>AI Insights</span>
          <Badge variant="outline" className="text-[10px]">{insights.length} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayed.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No active insights</p>
        ) : (
          displayed.map((insight) => {
            const Icon = insightIcons[insight.type] ?? insightIcons.default;
            const color = insightColors[insight.type] ?? "text-muted-foreground border-muted bg-muted/20";
            return (
              <div key={insight.id} className={cn("rounded-md border p-3", color)}>
                <div className="mb-1.5 flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs font-medium">{insight.title}</span>
                  <Badge variant="outline" className={cn(
                    "ml-auto text-[9px]",
                    insight.severity === "critical" ? "text-red-400 border-red-500/30" : insight.severity === "high" ? "text-orange-400 border-orange-500/30" : "text-muted-foreground",
                  )}>
                    {insight.severity}
                  </Badge>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">{insight.description}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Affected: {insight.zoneId ?? "Unknown"}</span>
                  <span className="text-[9px] text-muted-foreground">{new Date(insight.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })
        )}
        {insights.length > 6 && (
          <p className="text-center text-[10px] text-muted-foreground">+{insights.length - 6} more insights</p>
        )}
      </CardContent>
    </Card>
  );
}
