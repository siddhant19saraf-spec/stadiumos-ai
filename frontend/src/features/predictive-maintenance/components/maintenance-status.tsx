// @ts-nocheck
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MaintenanceStatusProps {
  totalAssets: number;
  maintenanceCompliance: number;
  dueCount: number;
  className?: string;
}

export function MaintenanceStatus({ totalAssets, maintenanceCompliance, dueCount, className }: MaintenanceStatusProps) {
  const complianceColor = maintenanceCompliance >= 90 ? "text-emerald-400" : maintenanceCompliance >= 75 ? "text-amber-400" : "text-red-400";
  const complianceBar = maintenanceCompliance >= 90 ? "bg-emerald-500" : maintenanceCompliance >= 75 ? "bg-amber-500" : "bg-red-500";

  return (
    <Card className={cn("border-primary/10", className)}>
      <CardContent className="p-4">
        <h3 className="mb-3 text-xs font-medium text-card-foreground">Maintenance Compliance</h3>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Compliance Rate</span>
              <span className={cn("font-medium tabular-nums", complianceColor)}>{maintenanceCompliance}%</span>
            </div>
            <Progress value={maintenanceCompliance} className="h-1.5" indicatorclass={complianceBar} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-md bg-primary/5 p-2">
              <p className="text-muted-foreground">Total Assets</p>
              <p className="text-sm font-medium tabular-nums">{totalAssets}</p>
            </div>
            <div className="rounded-md bg-amber-500/5 p-2">
              <p className="text-amber-400">Due / Scheduled</p>
              <p className="text-sm font-medium tabular-nums text-amber-400">{dueCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

