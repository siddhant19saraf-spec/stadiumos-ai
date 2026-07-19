"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AssetTypeBreakdownProps {
  breakdown: { type: string; count: number; avgHealth: number }[];
  className?: string;
}

const healthColor = (score: number) =>
  score >= 70 ? "text-emerald-400" : score >= 45 ? "text-amber-400" : "text-red-400";
const healthBar = (score: number) =>
  score >= 70 ? "bg-emerald-500" : score >= 45 ? "bg-amber-500" : "bg-red-500";

export function AssetTypeBreakdown({ breakdown, className }: AssetTypeBreakdownProps) {
  if (breakdown.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
        No asset type data available
      </div>
    );
  }

  return (
    <Card className={cn("border-primary/10", className)}>
      <CardContent className="p-4">
        <h3 className="mb-3 text-xs font-medium text-card-foreground">Asset Health by Type</h3>
        <div className="space-y-2">
          {breakdown.map((item) => (
            <div key={item.type}>
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-card-foreground capitalize">{item.type.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">({item.count})</span>
                </div>
                <span className={cn("font-medium tabular-nums", healthColor(item.avgHealth))}>
                  {item.avgHealth}%
                </span>
              </div>
              <Progress value={item.avgHealth} className="h-1" indicatorclass={healthBar(item.avgHealth)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
