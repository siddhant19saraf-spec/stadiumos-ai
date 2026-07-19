"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Car, Gauge, AlertTriangle, Ban, Timer, Route } from "lucide-react";
import type { TrafficRoad, TrafficCondition } from "../types";

interface TrafficPanelProps {
  roads: TrafficRoad[];
  traffic: TrafficCondition;
  selectedRoadId: string | null;
  onSelectRoad: (id: string) => void;
  className?: string;
}

const congestionColors: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  severe: "bg-red-500/10 text-red-400 border-red-500/20",
};

const healthColor = (score: number) =>
  score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";

export function TrafficPanel({ roads, traffic, selectedRoadId, onSelectRoad, className }: TrafficPanelProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Traffic Intelligence</span>
          <Badge variant="outline" className={cn("text-[10px]", healthColor(traffic.trafficHealthScore))}>
            Score: {traffic.trafficHealthScore}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MiniStat icon={Car} label="Total Vehicles" value={traffic.totalVehicles.toLocaleString()} />
          <MiniStat icon={Gauge} label="Avg Speed" value={`${traffic.avgSpeed} km/h`} />
          <MiniStat icon={AlertTriangle} label="Congested" value={`${traffic.congestedRoads} roads`} color={traffic.congestedRoads > 2 ? "text-red-400" : "text-muted-foreground"} />
          <MiniStat icon={Ban} label="Blocked" value={`${traffic.blockedRoads} roads`} color={traffic.blockedRoads > 0 ? "text-red-400" : "text-emerald-400"} />
          <MiniStat icon={Timer} label="Avg Queue" value={`${traffic.avgQueueLength}m`} />
          <MiniStat icon={Route} label="Avg Gate Cong." value={`${traffic.gateCongestionAvg}%`} />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground">Road Status</p>
          {roads.map((road) => (
            <button
              key={road.id}
              className={cn(
                "w-full rounded-md border p-2 text-left transition-all hover:brightness-110",
                congestionColors[road.congestionLevel] ?? "border-muted bg-muted/20",
                selectedRoadId === road.id && "ring-1 ring-primary",
              )}
              onClick={() => onSelectRoad(road.id)}
              tabIndex={0}
              aria-label={`${road.name}: ${road.congestionLevel} congestion, ${road.currentSpeedKmph} km/h`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-medium">
                  {road.name.length > 22 ? road.name.slice(0, 22) + "..." : road.name}
                  {road.status === "closed" && <Ban className="h-2.5 w-2.5 text-red-400" />}
                </span>
                <span className="rounded bg-background/60 px-1.5 py-0.5 text-[8px] font-medium uppercase">
                  {road.congestionLevel}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground">
                <span>{road.currentSpeedKmph} km/h</span>
                <span>{road.queueLengthMeters}m queue</span>
                <span>{road.gateCongestionPercent}% gate</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/20 px-2.5 py-1.5">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-[9px] text-muted-foreground">{label}</p>
        <p className={cn("text-xs font-medium text-card-foreground", color)}>{value}</p>
      </div>
    </div>
  );
}
