"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Wrench, Clock, AlertTriangle, CheckCircle2, Users, Brain } from "lucide-react";
import type { WorkOrder } from "../types";

interface WorkOrderListProps {
  orders: WorkOrder[];
  onComplete?: (woId: string) => void;
  className?: string;
}

const priorityStyles: Record<string, string> = {
  emergency: "bg-red-500/10 text-red-400 border-red-500/20",
  urgent: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const statusStyles: Record<string, string> = {
  open: "bg-slate-500/10 text-slate-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-400",
  cancelled: "bg-red-500/10 text-red-400",
};

export function WorkOrderList({ orders, onComplete, className }: WorkOrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
        No work orders generated
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {orders.map((wo) => (
        <Card key={wo.id} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-card-foreground">{wo.title}</span>
                  <Badge variant="outline" className={cn("text-[10px]", priorityStyles[wo.priority])}>
                    {wo.priority}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[10px]", statusStyles[wo.status])}>
                    {wo.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{wo.assetName}</p>
              </div>
              {wo.status !== "completed" && onComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={(e) => { e.stopPropagation(); onComplete(wo.id); }}
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Complete
                </Button>
              )}
            </div>

            {wo.status === "open" && wo.aiReasoning && (
              <div className="mt-2 flex items-start gap-1.5 rounded bg-primary/5 px-2 py-1.5">
                <Brain className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span className="text-[10px] text-muted-foreground">{wo.aiReasoning}</span>
              </div>
            )}

            {wo.status === "open" && wo.businessImpact && (
              <div className="mt-1.5 flex items-start gap-1.5 rounded bg-amber-500/5 px-2 py-1">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                <span className="text-[10px] text-amber-400">{wo.businessImpact}</span>
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              {wo.assignedTeam && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {wo.assignedTeam}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {wo.estimatedRepairMin}min estimated
              </span>
              <span className="flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                {wo.requiredSkills.slice(0, 2).join(", ")}
              </span>
            </div>

            {wo.requiredParts.length > 0 && (
              <div className="mt-1.5 text-[10px] text-muted-foreground">
                Parts: {wo.requiredParts.join(", ")}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
