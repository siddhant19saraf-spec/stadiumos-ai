"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RiskMatrixProps {
  healthScores: number[];
  riskScores: number[];
  className?: string;
}

function countInRange(values: number[], min: number, max: number): number {
  return values.filter((v) => v >= min && v <= max).length;
}

const quadrants = [
  { label: "Critical", healthRange: [0, 29], riskRange: [50, 100], color: "bg-red-500/20 border-red-500/30 text-red-400" },
  { label: "High Risk", healthRange: [0, 29], riskRange: [25, 49], color: "bg-orange-500/20 border-orange-500/30 text-orange-400" },
  { label: "Warning", healthRange: [30, 59], riskRange: [50, 100], color: "bg-amber-500/20 border-amber-500/30 text-amber-400" },
  { label: "Elevated", healthRange: [30, 59], riskRange: [25, 49], color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
  { label: "Fair", healthRange: [60, 79], riskRange: [0, 24], color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  { label: "Good", healthRange: [80, 100], riskRange: [0, 24], color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  { label: "Monitor", healthRange: [60, 79], riskRange: [25, 49], color: "bg-primary/10 border-primary/20 text-primary" },
  { label: "Healthy", healthRange: [80, 100], riskRange: [25, 49], color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
];

export function RiskMatrix({ healthScores, riskScores, className }: RiskMatrixProps) {
  if (healthScores.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
        No risk data available
      </div>
    );
  }

  return (
    <Card className={cn("border-primary/10", className)}>
      <CardContent className="p-4">
        <h3 className="mb-3 text-xs font-medium text-card-foreground">Risk Distribution Matrix</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quadrants.map((q) => {
            const count = healthScores.reduce((acc, h, i) => {
              if (h >= q.healthRange[0] && h <= q.healthRange[1] && riskScores[i] >= q.riskRange[0] && riskScores[i] <= q.riskRange[1]) {
                return acc + 1;
              }
              return acc;
            }, 0);
            const pct = Math.round((count / healthScores.length) * 100);

            return (
              <div key={q.label} className={cn("rounded-md border p-2", q.color)}>
                <p className="text-[10px] font-medium">{q.label}</p>
                <p className="text-lg font-bold tabular-nums">{count}</p>
                <p className="text-[10px] opacity-70">{pct}% of fleet</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
