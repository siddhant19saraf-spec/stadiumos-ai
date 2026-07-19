"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Gauge, Target, Timer, CheckCircle2, ArrowRight, Users, Car, Clock, Shield, Zap, Wrench, AlertTriangle } from "lucide-react";
import type { RecommendedDecision, Priority, ActionCategory } from "../types";

interface CopilotRecommendedDecisionsProps {
  decisions: RecommendedDecision[];
  onApply?: (decision: RecommendedDecision) => void;
  onCompare?: (decision: RecommendedDecision) => void;
  className?: string;
}

const priorityConfig: Record<Priority, { color: string; label: string }> = {
  critical: { color: "text-red-400 border-red-500/30 bg-red-500/10", label: "Critical" },
  high: { color: "text-amber-400 border-amber-500/30 bg-amber-500/10", label: "High" },
  medium: { color: "text-blue-400 border-blue-500/30 bg-blue-500/10", label: "Medium" },
  low: { color: "text-muted-foreground border-border bg-muted/50", label: "Low" },
};

const categoryIcons: Record<ActionCategory, typeof Lightbulb> = {
  crowd: Users, security: Shield, parking: Car, staff: Users,
  energy: Zap, maintenance: Wrench, emergency: AlertTriangle, operations: Lightbulb,
};

const categoryLabels: Record<ActionCategory, string> = {
  crowd: "Crowd", security: "Security", parking: "Parking", staff: "Staff",
  energy: "Energy", maintenance: "Maint.", emergency: "Emergency", operations: "Ops",
};

function generateDecisions(): RecommendedDecision[] {
  return [
    {
      id: "dec-1", title: "Open Additional Entry Gates", description: "East Gate congestion reaching critical levels", priority: "critical", businessImpact: "Reduces entry wait times by 40%, prevents crowd bottleneck", confidence: 94, category: "crowd", requiresConfirmation: true,
      options: [
        { label: "Option A: Open Gate D", action: "Activate Gate D auxiliary entry", expectedReduction: "40% crowd reduction", implementationCost: "low", risk: "low", implementationTime: "5 min", confidence: 94 },
        { label: "Option B: Gate B Staff Augmentation", action: "Deploy 4 additional staff to Gate B checkpoints", expectedReduction: "25% wait time reduction", implementationCost: "low", risk: "low", requiredStaff: 4, implementationTime: "8 min", confidence: 88 },
      ],
    },
    {
      id: "dec-2", title: "Deploy Parking Overflow Protocol", description: "Parking Lot C at 94% capacity", priority: "high", businessImpact: "Prevents traffic congestion and entry delays", confidence: 91, category: "parking", requiresConfirmation: true,
      options: [
        { label: "Option A: Redirect to Lot E", action: "Activate signage and redirect to Lot E (23% capacity)", expectedReduction: "Extends parking capacity by 45 min", implementationCost: "low", risk: "low", implementationTime: "10 min", confidence: 91 },
        { label: "Option B: Valet Express", action: "Activate express valet at North Entry", expectedReduction: "150 additional vehicles/hour", implementationCost: "medium", risk: "low", requiredStaff: 3, implementationTime: "15 min", confidence: 85 },
      ],
    },
    {
      id: "dec-3", title: "Activate Halftime Staff Surge", description: "Queue times predicted to spike to 25+ minutes", priority: "high", businessImpact: "Maintains fan satisfaction above 4.0/5 during peak period", confidence: 93, category: "staff", requiresConfirmation: true,
      options: [
        { label: "Option A: Deploy Standby Staff", action: "Activate 12 standby staff to all food courts", expectedReduction: "Reduces queue time by 55%", implementationCost: "medium", risk: "low", requiredStaff: 12, implementationTime: "12 min", confidence: 93 },
        { label: "Option B: Dynamic Lane Opening", action: "Open 4 additional service lanes per court", expectedReduction: "40% throughput increase", implementationCost: "low", risk: "low", implementationTime: "6 min", confidence: 87 },
      ],
    },
    {
      id: "dec-4", title: "Security Reinforcement Request", description: "Section 312 security coverage below threshold", priority: "medium", businessImpact: "Restores security coverage to recommended 100%", confidence: 88, category: "security", requiresConfirmation: false,
      options: [
        { label: "Reassign from North Stand", action: "Move 2 units from North Stand (low traffic) to Section 312", expectedReduction: "Restores coverage to 100%", implementationCost: "low", risk: "low", requiredStaff: 2, implementationTime: "5 min", confidence: 88 },
      ],
    },
  ];
}

export function CopilotRecommendedDecisions({
  decisions = generateDecisions(),
  onApply,
  onCompare,
  className,
}: CopilotRecommendedDecisionsProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="h-4 w-4 text-amber-400" aria-hidden="true" />
          Recommended Decisions
          <Badge variant="secondary" className="ml-auto text-[10px]">{decisions.length} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {decisions.map((dec) => {
          const config = priorityConfig[dec.priority];
          const CatIcon = categoryIcons[dec.category];

          return (
            <div
              key={dec.id}
              className={cn(
                "rounded-lg border p-3 transition-colors hover:bg-accent/20",
                dec.priority === "critical" ? "border-red-500/20 bg-red-500/[0.02]" : "border-border",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
                    <CatIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{dec.title}</p>
                    <p className="text-[11px] text-muted-foreground">{dec.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("shrink-0 text-[9px] px-1.5", config.color)}>{config.label}</Badge>
              </div>

              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="gap-1 text-[9px] px-1.5 py-0">
                  <Target className="h-3 w-3" aria-hidden="true" />
                  {dec.businessImpact}
                </Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  {dec.confidence}% confidence
                </Badge>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {categoryLabels[dec.category]}
                </Badge>
              </div>

              <div className="flex gap-1.5">
                {onApply && (
                  <Button size="sm" variant="default" className="h-7 text-[10px] px-2.5" onClick={() => onApply(dec)} aria-label={`Apply decision: ${dec.title}`}>
                    <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                    Apply
                  </Button>
                )}
                {onCompare && dec.options.length > 1 && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] px-2.5" onClick={() => onCompare(dec)} aria-label={`Compare options for: ${dec.title}`}>
                    <ArrowRight className="mr-1 h-3 w-3" aria-hidden="true" />
                    Compare Options
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

