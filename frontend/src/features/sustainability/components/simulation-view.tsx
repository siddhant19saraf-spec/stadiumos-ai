"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Beaker } from "lucide-react";
import type { SustainabilityState } from "../types";
import { simulationEngine } from "../services/simulation-engine";

export function SimulationView({ state, onRun }: { state: SustainabilityState; onRun: (id: string) => void }) {
  const scenarios = simulationEngine.getScenarios();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {scenarios.map((s: { id: string; title: string; category: string; description: string; impactMetrics: { energyIncreasePct: number; waterIncreasePct: number; carbonIncreasePct: number } }) => (
          <Card key={s.id} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium text-card-foreground">{s.title}</span>
                  <Badge variant="outline" className="ml-2 text-[10px] capitalize text-muted-foreground">{s.category}</Badge>
                </div>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{s.description}</p>
              <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                <span>Energy impact: +{s.impactMetrics.energyIncreasePct}%</span>
                <span className="ml-2">Water: +{s.impactMetrics.waterIncreasePct}%</span>
                <span className="ml-2">Carbon: +{s.impactMetrics.carbonIncreasePct}%</span>
              </div>
              <Button variant="outline" size="sm" className="mt-2 h-7 w-full text-[10px]" onClick={() => onRun(s.id)}>
                <Beaker className="mr-1 h-3 w-3" />
                Run Simulation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {state.simulationResult && (
        <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardContent className="p-4">
            <h3 className="mb-3 text-xs font-medium text-card-foreground">
              Simulation Results: {state.simulationResult.scenarioTitle}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-red-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Predicted Energy</p>
                <p className="text-sm font-bold text-red-400">{state.simulationResult.predictedEnergyKwh.toLocaleString()} kWh</p>
              </div>
              <div className="rounded-md bg-emerald-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Mitigated Energy</p>
                <p className="text-sm font-bold text-emerald-400">{state.simulationResult.mitigatedEnergyKwh.toLocaleString()} kWh</p>
              </div>
              <div className="rounded-md bg-red-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Predicted Cost</p>
                <p className="text-sm font-bold text-red-400">${state.simulationResult.predictedCost.toLocaleString()}</p>
              </div>
              <div className="rounded-md bg-emerald-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Cost Savings</p>
                <p className="text-sm font-bold text-emerald-400">${state.simulationResult.costSavings.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Energy Savings</p>
                <p className="text-xs font-medium tabular-nums">{state.simulationResult.energySavingsPct}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Carbon Savings</p>
                <p className="text-xs font-medium tabular-nums">{state.simulationResult.carbonSavingsPct}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Water Impact</p>
                <p className="text-xs font-medium tabular-nums">{state.simulationResult.waterSavingsPct}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Predicted CO₂</p>
                <p className="text-xs font-medium tabular-nums">{state.simulationResult.predictedCO2Kg.toLocaleString()} kg</p>
              </div>
            </div>
            {state.simulationResult.recommendedActions.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">AI Strategies:</p>
                {state.simulationResult.aiStrategies.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <div className="flex-1">
                      <span>{s.action}</span>
                      <span className="ml-2 text-emerald-400">({s.impact})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
