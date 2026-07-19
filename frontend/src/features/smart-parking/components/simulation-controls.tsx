"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play, Square, Sparkles, AlertTriangle, CloudRain, Star, Trophy, Zap, ParkingCircle, Car, CircleX, ArrowUpWideNarrow, Baby } from "lucide-react";
import { SCENARIO_CONFIGS } from "../constants";
import type { SimulationScenario } from "../types";

interface SimulationControlsProps {
  active: boolean;
  activeScenario: SimulationScenario | null;
  onStart: (s: SimulationScenario) => void;
  onStop: () => void;
  className?: string;
}

const scenarioIcons: Record<string, React.ElementType> = {
  heavy_rain: CloudRain, vip_arrival: Star, final_match: Trophy, power_failure: Zap,
  overflow_parking: ParkingCircle, emergency_evacuation: AlertTriangle, road_closure: CircleX,
  event_exit_surge: ArrowUpWideNarrow, peak_traffic: Car, holiday_event: Baby,
};

export function SimulationControls({ active, activeScenario, onStart, onStop, className }: SimulationControlsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Simulation Engine</span>
          {active && (
            <Badge variant="outline" className="bg-emerald-500/10 text-[10px] text-emerald-400">ACTIVE</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {(Object.entries(SCENARIO_CONFIGS) as [SimulationScenario, typeof SCENARIO_CONFIGS[SimulationScenario]][]).map(([id, config]) => {
          const isRunning = active && activeScenario === id;
          const Icon = scenarioIcons[id] ?? Sparkles;
          return (
            <div
              key={id}
              className={cn("rounded-md border transition-all", isRunning && "border-emerald-500/30 bg-emerald-500/5", !isRunning && !active && "hover:border-muted-foreground/20")}
            >
              <button
                className="flex w-full items-center gap-3 px-3 py-2 text-left"
                onClick={() => setExpanded(expanded === id ? null : id)}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: config.color, opacity: 0.8 }}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-xs font-medium", isRunning && "text-emerald-400")}>{config.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{config.description}</p>
                </div>
                <Button
                  variant={isRunning ? "destructive" : "outline"}
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => { e.stopPropagation(); isRunning ? onStop() : onStart(id); }}
                  disabled={active && !isRunning}
                  aria-label={isRunning ? `Stop ${config.name}` : `Start ${config.name}`}
                >
                  {isRunning ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
              </button>
              {expanded === id && (
                <div className="border-t px-3 py-2">
                  <p className="mb-1.5 text-[10px] text-muted-foreground">{config.details}</p>
                  <div className="flex flex-wrap gap-1">
                    {config.tags.map((tag) => (
                      <span key={tag} className="rounded bg-muted/50 px-1.5 py-0.5 text-[9px] text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
