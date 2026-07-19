"use client";

import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "./kpi-card";
import { Wind, Zap, BarChart3, Leaf, TrendingUp, Target } from "lucide-react";
import type { SustainabilityState } from "../types";

export function CarbonView({ state }: { state: SustainabilityState }) {
  const c = state.carbonMetrics;
  if (!c) return <div className="text-xs text-muted-foreground">Loading carbon data...</div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiCard label="Scope 1 (Direct)" value={`${c.scope1.toFixed(0)}`} sub="kg CO₂" icon={Wind} color="text-red-400" bg="bg-red-500/10" />
        <KpiCard label="Scope 2 (Grid)" value={`${c.scope2.toFixed(0)}`} sub="kg CO₂" icon={Zap} color="text-orange-400" bg="bg-orange-500/10" />
        <KpiCard label="Scope 3 (Supply Chain)" value={`${c.scope3.toFixed(0)}`} sub="kg CO₂" icon={BarChart3} color="text-amber-400" bg="bg-amber-500/10" />
        <KpiCard label="Total CO₂" value={`${(c.totalCO2 / 1000).toFixed(1)}`} sub="tCO₂e" icon={Wind} color={c.totalCO2 > 22000 ? "text-red-400" : "text-emerald-400"} bg="bg-red-500/10" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiCard label="CO₂ Intensity" value={c.co2PerKwh.toFixed(4)} sub="kg/kWh" icon={BarChart3} color="text-muted-foreground" bg="bg-primary/10" />
        <KpiCard label="Renewable %" value={`${c.renewablePct}%`} sub="of energy mix" icon={Leaf} color="text-emerald-400" bg="bg-emerald-500/10" />
        <KpiCard label="Carbon Offset" value={`${c.carbonOffset.toFixed(0)}`} sub="kg CO₂" icon={TrendingUp} color="text-cyan-400" bg="bg-cyan-500/10" />
        <KpiCard label="Net CO₂" value={`${c.netCO2.toFixed(0)}`} sub="kg CO₂" icon={Target} color={c.netCO2 < 20000 ? "text-emerald-400" : "text-red-400"} bg="bg-emerald-500/10" />
      </div>
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Emissions Breakdown</h3>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scope 1 (Generators, fleet)</span>
              <span className="font-medium tabular-nums">{c.scope1.toFixed(0)} kg</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-red-500" style={{ width: `${(c.scope1 / Math.max(1, c.totalCO2)) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scope 2 (Grid electricity)</span>
              <span className="font-medium tabular-nums">{c.scope2.toFixed(0)} kg</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-orange-500" style={{ width: `${(c.scope2 / Math.max(1, c.totalCO2)) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scope 3 (Water, waste, supply chain)</span>
              <span className="font-medium tabular-nums">{c.scope3.toFixed(0)} kg</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${(c.scope3 / Math.max(1, c.totalCO2)) * 100}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>
      {state.energyPredictions.filter((p) => p.type === "demand_forecast").length > 0 && (
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Carbon Forecast (12 months)</h3>
            <div className="text-[10px] text-muted-foreground">
              <p>Projected trajectory: {c.netCO2 < 20000 ? "On track" : "Requires acceleration"} for 2035 net-zero target</p>
              <p className="mt-1">Current reduction rate: {Math.round((1 - c.netCO2 / 25000) * 100)}% toward goal</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
