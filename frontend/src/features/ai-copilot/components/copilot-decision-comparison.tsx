"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, CheckCircle2, X, ArrowRight, Timer, Users, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";
import type { DecisionOption } from "../types";

interface CopilotDecisionComparisonProps {
  title: string;
  options: DecisionOption[];
  onSelect: (option: DecisionOption) => void;
  onClose: () => void;
  className?: string;
}

export function CopilotDecisionComparison({
  title,
  options,
  onSelect,
  onClose,
  className,
}: CopilotDecisionComparisonProps) {
  return (
    <Card className={cn("border-amber-500/20", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Scale className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Decision Comparison: {title}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} aria-label="Close comparison">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg border p-3",
                i === 0 ? "border-primary/30 bg-primary/[0.02]" : "border-border",
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={i === 0 ? "default" : "secondary"} className="text-[10px]">
                  {i === 0 ? "Recommended" : "Alternative"}
                </Badge>
              </div>
              <p className="mb-1 text-sm font-medium text-foreground">{option.label}</p>
              <p className="mb-2 text-xs text-muted-foreground">{option.action}</p>

              <div className="space-y-1.5">
                {option.expectedReduction && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <TrendingDown className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                    {option.expectedReduction}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <DollarSign className="h-3 w-3 text-amber-400" aria-hidden="true" />
                  Cost: <Badge variant="outline" className="text-[9px] px-1 py-0">{option.implementationCost}</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 text-red-400" aria-hidden="true" />
                  Risk: <Badge variant="outline" className="text-[9px] px-1 py-0">{option.risk}</Badge>
                </div>
                {option.requiredStaff && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3 text-blue-400" aria-hidden="true" />
                    Staff needed: {option.requiredStaff}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Timer className="h-3 w-3 text-purple-400" aria-hidden="true" />
                  Implementation: {option.implementationTime}
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {option.confidence}% confidence
                  </Badge>
                </div>
              </div>

              <Button
                size="sm"
                variant={i === 0 ? "default" : "outline"}
                className="mt-3 h-7 w-full text-[10px]"
                onClick={() => onSelect(option)}
                aria-label={`Select ${option.label}`}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                Select This Option
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

