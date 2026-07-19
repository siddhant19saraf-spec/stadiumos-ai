"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";

interface Highlight {
  type: "positive" | "warning" | "critical" | "info";
  message: string;
}

interface AIExecutiveSummaryProps {
  summary: string;
  highlights: Highlight[];
  generatedAt: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const highlightConfig = {
  positive: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  critical: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

export function AIExecutiveSummary({
  summary,
  highlights,
  generatedAt,
  isRefreshing,
  className,
}: AIExecutiveSummaryProps) {
  return (
    <Card className={cn("overflow-hidden border-primary/10", className)}>
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/5 via-primary/5 to-transparent p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
              <Bot className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              AI Executive Summary
            </span>
            {isRefreshing && (
              <Sparkles className="ml-auto h-3.5 w-3.5 animate-pulse text-amber-400" aria-label="Refreshing..." />
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{summary}</p>
          {highlights.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5" role="list" aria-label="AI highlights">
              {highlights.map((highlight, i) => {
                const config = highlightConfig[highlight.type];
                const Icon = config.icon;
                return (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn("border text-xs font-normal", config.border, config.bg, config.color)}
                    role="listitem"
                  >
                    <Icon className="mr-1 h-3 w-3" aria-hidden="true" />
                    {highlight.message}
                  </Badge>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">
            Last updated: {new Date(generatedAt).toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
