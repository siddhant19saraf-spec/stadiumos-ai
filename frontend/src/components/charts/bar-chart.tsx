"use client";

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface BarChartPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartPoint[];
  height?: number;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  ariaLabel?: string;
}

const defaultFormatter = (value: number) => value.toLocaleString();

export function BarChart({
  data,
  height = 200,
  showGrid = false,
  formatValue = defaultFormatter,
  className,
  ariaLabel,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center rounded-md bg-muted/20", className)}
        style={{ height }}
        role="status"
        aria-label="No chart data available"
      >
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div
      className={cn("w-full", className)}
      role="img"
      aria-label={ariaLabel ?? "Bar chart"}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBar data={data} barCategoryGap="30%">
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          )}
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "13px",
            }}
            formatter={(value: number) => [formatValue(value), "Value"]}
          />
          <Bar
            dataKey="value"
            radius={[3, 3, 0, 0]}
            maxBarSize={40}
            fill="hsl(var(--primary))"
          />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
