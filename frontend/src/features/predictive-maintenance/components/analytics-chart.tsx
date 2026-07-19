"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TrendData } from "../types";

interface AnalyticsChartProps {
  trends: TrendData[];
  className?: string;
}

export function AnalyticsChart({ trends, className }: AnalyticsChartProps) {
  if (trends.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
        No trend data available
      </div>
    );
  }

  const displayData = trends.filter((_, i) => i % 3 === 0 || i === trends.length - 1);

  return (
    <Card className={cn("border-primary/10", className)}>
      <CardContent className="p-4">
        <h3 className="mb-3 text-xs font-medium text-card-foreground">Health & Risk Trends (30 days)</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => v.slice(5)}
                stroke="hsl(var(--border))"
              />
              <YAxis
                yAxisId="health"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
                label={{ value: "Health %", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
              />
              <YAxis
                yAxisId="failures"
                orientation="right"
                domain={[0, 20]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
                label={{ value: "Predicted Failures", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
              />
              <Line
                yAxisId="health"
                type="monotone"
                dataKey="avgHealthScore"
                name="Avg Health Score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="health"
                type="monotone"
                dataKey="avgRiskScore"
                name="Avg Risk Score"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                yAxisId="failures"
                type="monotone"
                dataKey="predictedFailures"
                name="Predicted Failures"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
