"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { ChartArea, TrendingUp, Car, Clock, AlertTriangle, Zap, DollarSign } from "lucide-react";
import type { ChartDataPoint } from "../types";

interface LiveChartsProps {
  attendanceTimeline: ChartDataPoint[];
  crowdDensityTrend: ChartDataPoint[];
  parkingOccupancy: ChartDataPoint[];
  queueForecast: ChartDataPoint[];
  incidentTimeline: ChartDataPoint[];
  energyUsage: ChartDataPoint[];
  revenueTrend: ChartDataPoint[];
  className?: string;
}

function ChartCard({
  title,
  icon: Icon,
  data,
  color,
  secondaryColor,
  showSecondary,
  formatValue,
  children,
}: {
  title: string;
  icon: typeof ChartArea;
  data: ChartDataPoint[];
  color?: string;
  secondaryColor?: string;
  showSecondary?: boolean;
  formatValue?: (value: number) => string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {children ?? (
          <AreaChart
            data={data}
            height={160}
            color={color}
            secondaryColor={secondaryColor}
            showSecondary={showSecondary}
            formatValue={formatValue}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function LiveCharts({
  attendanceTimeline,
  crowdDensityTrend,
  parkingOccupancy,
  queueForecast,
  incidentTimeline,
  energyUsage,
  revenueTrend,
  className,
}: LiveChartsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <ChartArea className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-medium text-foreground">Live Analytics</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3">
        <ChartCard
          title="Attendance Flow"
          icon={TrendingUp}
          data={attendanceTimeline}
          color="var(--color-primary)"
          formatValue={(v) => `${(v / 1000).toFixed(0)}K`}
        />
        <ChartCard
          title="Crowd Density"
          icon={ChartArea}
          data={crowdDensityTrend}
          color="#f59e0b"
          formatValue={(v) => `${v.toFixed(0)}%`}
        />
        <ChartCard
          title="Parking Occupancy"
          icon={Car}
          data={parkingOccupancy}
          color="#3b82f6"
          formatValue={(v) => `${v.toFixed(0)}%`}
        />
        <ChartCard
          title="Queue Forecast"
          icon={Clock}
          data={queueForecast}
          color="#8b5cf6"
          formatValue={(v) => `${v.toFixed(0)}m`}
        />
        <ChartCard
          title="Incident Timeline"
          icon={AlertTriangle}
          data={incidentTimeline}
          color="#ef4444"
          formatValue={(v) => v.toFixed(0)}
        />
        <ChartCard
          title="Energy Usage"
          icon={Zap}
          data={energyUsage}
          color="#10b981"
          formatValue={(v) => `${v.toFixed(0)} kWh`}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChartCard
          title="Revenue Trend"
          icon={DollarSign}
          data={revenueTrend}
          color="#22c55e"
          formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Zone Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <BarChart
              data={[
                { label: "Gate A", value: 85 },
                { label: "Gate B", value: 62 },
                { label: "Gate C", value: 78 },
                { label: "Gate D", value: 45 },
                { label: "East", value: 92 },
                { label: "West", value: 68 },
              ]}
              height={160}
              formatValue={(v) => `${v}%`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
