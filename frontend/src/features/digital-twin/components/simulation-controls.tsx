"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play, Square, Sparkles, AlertTriangle } from "lucide-react";
import { SIMULATION_SCENARIOS } from "../constants";
import type { SimulationScenario } from "../types";

interface SimulationControlsProps {
  active: boolean;
  activeScenario: SimulationScenario | null;
  onStart: (s: SimulationScenario) => void;
  onStop: () => void;
  className?: string;
}

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
      <CardContent className="space-y-2">
        {SIMULATION_SCENARIOS.map((scenario) => {
          const isRunning = active && activeScenario?.id === scenario.id;
          return (
            <div
              key={scenario.id}
              className={cn(
                "rounded-md border transition-all",
                isRunning && "border-emerald-500/30 bg-emerald-500/5",
                !isRunning && !active && "hover:border-muted-foreground/20",
              )}
            >
              <button
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                onClick={() => setExpanded(expanded === scenario.id ? null : scenario.id)}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: scenario.color, opacity: 0.8 }}>
                  {scenario.icon === "sparkles" ? <Sparkles className="h-3.5 w-3.5 text-white" /> : <AlertTriangle className="h-3.5 w-3.5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-medium", isRunning && "text-emerald-400")}>{scenario.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{scenario.description}</p>
                </div>
                <Button
                  variant={isRunning ? "destructive" : "outline"}
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => { e.stopPropagation(); isRunning ? onStop() : onStart(scenario); }}
                  disabled={active && !isRunning}
                  aria-label={isRunning ? `Stop ${scenario.name}` : `Start ${scenario.name}`}
                >
                  {isRunning ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
              </button>
              {expanded === scenario.id && (
                <div className="border-t px-3 py-2">
                  <p className="mb-1.5 text-[10px] text-muted-foreground">{scenario.details}</p>
                  <div className="flex flex-wrap gap-1">
                    {scenario.tags.map((tag) => (
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

