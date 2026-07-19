"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Lightbulb } from "lucide-react";
import type { SustainabilityState } from "../types";

export function ReportsView({ state, onGenerate }: { state: SustainabilityState; onGenerate: () => void }) {
  return (
    <div className="space-y-3">
      <Card className="border-primary/10">
        <CardContent className="flex items-center justify-between p-3">
          <div>
            <h3 className="text-xs font-medium text-card-foreground">Executive Sustainability Report</h3>
            <p className="text-[10px] text-muted-foreground">Comprehensive report covering energy, water, waste, carbon, and ESG KPIs</p>
          </div>
          <Button variant="default" size="sm" className="h-7 text-[10px]" onClick={onGenerate}>
            <FileText className="mr-1 h-3 w-3" />
            Generate Report
          </Button>
        </CardContent>
      </Card>
      {state.lastReport && (
        <Card className="border-emerald-500/20">
          <CardContent className="p-4">
            <h3 className="mb-3 text-xs font-medium text-card-foreground">{state.lastReport.title}</h3>
            <p className="text-[10px] text-muted-foreground">Period: {state.lastReport.period}</p>
            <p className="text-[10px] text-muted-foreground">Generated: {new Date(state.lastReport.generatedAt).toLocaleString()}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <div className="rounded-md bg-amber-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Energy</p>
                <p className="text-sm font-bold text-amber-400 tabular-nums">{(state.lastReport.summary.totalEnergyKwh / 1000).toFixed(1)}k</p>
              </div>
              <div className="rounded-md bg-blue-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Water</p>
                <p className="text-sm font-bold text-blue-400 tabular-nums">{(state.lastReport.summary.totalWaterL / 1000).toFixed(0)}kL</p>
              </div>
              <div className="rounded-md bg-purple-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Waste</p>
                <p className="text-sm font-bold text-purple-400 tabular-nums">{state.lastReport.summary.wasteGeneratedKg}kg</p>
              </div>
              <div className="rounded-md bg-red-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Carbon</p>
                <p className="text-sm font-bold text-red-400 tabular-nums">{(state.lastReport.summary.totalCO2Kg / 1000).toFixed(1)}t</p>
              </div>
              <div className="rounded-md bg-emerald-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Score</p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">{state.lastReport.summary.sustainabilityScore}/100</p>
              </div>
            </div>
            <div className="mt-3">
              <h4 className="mb-1.5 text-[10px] font-medium text-muted-foreground">ESG Scorecard</h4>
              <div className="space-y-1">
                {state.lastReport.esgScorecard.filter((_, i) => i < 5).map((kpi) => (
                  <div key={kpi.metric} className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">{kpi.metric}</span>
                    <span className="font-medium tabular-nums">{kpi.value} / {kpi.target} {kpi.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <h4 className="mb-1.5 text-[10px] font-medium text-muted-foreground">Top Recommendations</h4>
              <div className="space-y-1">
                {state.lastReport.topRecommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                    <span>{rec.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <h4 className="mb-1.5 text-[10px] font-medium text-muted-foreground">Forecast</h4>
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-5">
                <div><span className="text-muted-foreground">Next Energy</span><p className="font-medium tabular-nums">{state.lastReport.forecast.nextMonthEnergy.toLocaleString()} kWh</p></div>
                <div><span className="text-muted-foreground">Next Water</span><p className="font-medium tabular-nums">{state.lastReport.forecast.nextMonthWater.toLocaleString()} L</p></div>
                <div><span className="text-muted-foreground">Next Waste</span><p className="font-medium tabular-nums">{state.lastReport.forecast.nextMonthWaste} kg</p></div>
                <div><span className="text-muted-foreground">Next Carbon</span><p className="font-medium tabular-nums">{state.lastReport.forecast.nextMonthCarbon.toLocaleString()} kg</p></div>
                <div><span className="text-muted-foreground">Net-Zero by</span><p className="font-medium tabular-nums">{state.lastReport.forecast.netZeroProjectedDate}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
