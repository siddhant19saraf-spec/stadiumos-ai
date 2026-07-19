"use client";

import {
  AreaChart as RechartsArea,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface AreaChartPoint {
  timestamp: string;
  value: number;
  secondary?: number;
}

interface AreaChartProps {
  data: AreaChartPoint[];
  height?: number;
  color?: string;
  secondaryColor?: string;
  showGrid?: boolean;
  showSecondary?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  ariaLabel?: string;
}

const defaultFormatter = (value: number) => value.toLocaleString();

export function AreaChart({
  data,
  height = 200,
  color = "var(--color-primary)",
  secondaryColor = "var(--color-primary-foreground)",
  showGrid = false,
  showSecondary = false,
  formatValue = defaultFormatter,
  className,
  ariaLabel,
}: AreaChartProps) {
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
      aria-label={ariaLabel ?? "Area chart"}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsArea data={data}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          )}
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: string) => {
              const d = new Date(val);
              return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
            }}
            interval="preserveStartEnd"
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
            labelFormatter={(val: string) => new Date(val).toLocaleTimeString()}
            formatter={(value: number) => [formatValue(value), "Value"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${color})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          {showSecondary && (
            <Area
              type="monotone"
              dataKey="secondary"
              stroke={secondaryColor}
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="4 4"
              dot={false}
            />
          )}
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
}
