"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Users, Car, Clock, Shield, Zap, AlertTriangle, ChefHat } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SuggestedAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
}

interface CopilotSuggestedActionsProps {
  actions: SuggestedAction[];
  onSelect: (action: SuggestedAction) => void;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  Car,
  Clock,
  Shield,
  Zap,
  AlertTriangle,
  ChefHat,
  Lightbulb,
};

const categoryColors: Record<string, string> = {
  Crowd: "text-blue-400 bg-blue-500/10",
  Parking: "text-amber-400 bg-amber-500/10",
  Queue: "text-purple-400 bg-purple-500/10",
  Security: "text-red-400 bg-red-500/10",
  Energy: "text-green-400 bg-green-500/10",
  Staff: "text-cyan-400 bg-cyan-500/10",
  Emergency: "text-red-400 bg-red-500/10 border-red-500/30",
  Operations: "text-muted-foreground bg-muted/50",
};

const defaultActions: SuggestedAction[] = [
  { id: "risks", label: "Assess Active Risks", description: "Scan all zones for current threats", icon: "AlertTriangle", category: "Security", priority: "high" },
  { id: "parking", label: "Check Parking Status", description: "Review occupancy and overflow risk", icon: "Car", category: "Parking", priority: "high" },
  { id: "queue", label: "Analyze Queue Times", description: "Predict and optimize wait times", icon: "Clock", category: "Queue", priority: "medium" },
  { id: "crowd", label: "Monitor Crowd Flow", description: "Heatmap and density analysis", icon: "Users", category: "Crowd", priority: "medium" },
  { id: "staff", label: "Optimize Staff Deployment", description: "Reallocate based on demand", icon: "Shield", category: "Staff", priority: "low" },
  { id: "energy", label: "Review Energy Usage", description: "Check consumption and savings", icon: "Zap", category: "Energy", priority: "low" },
];

export function CopilotSuggestedActions({
  actions = defaultActions,
  onSelect,
  className,
}: CopilotSuggestedActionsProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="h-4 w-4 text-amber-400" aria-hidden="true" />
          Suggested Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = iconMap[action.icon] ?? Lightbulb;
          const categoryColor = categoryColors[action.category] ?? "text-muted-foreground bg-muted/50";

          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={() => onSelect(action)}
              className={cn(
                "flex h-auto flex-col items-center gap-1 py-3 text-xs",
                action.priority === "critical" && "border-red-500/30",
              )}
              aria-label={`${action.label}: ${action.description}`}
            >
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full", categoryColor)}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <span className="font-medium text-foreground/90">{action.label}</span>
              <span className="text-[10px] text-muted-foreground">{action.description}</span>
              <Badge
                variant="outline"
                className={cn(
                  "mt-1 text-[9px] px-1 py-0",
                  action.priority === "critical" && "border-red-500/30 text-red-400",
                  action.priority === "high" && "border-amber-500/30 text-amber-400",
                  action.priority === "medium" && "border-blue-500/30 text-blue-400",
                  action.priority === "low" && "border-border text-muted-foreground",
                )}
              >
                {action.priority}
              </Badge>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export type { SuggestedAction };
