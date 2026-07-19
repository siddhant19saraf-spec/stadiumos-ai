"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KpiCard } from "./kpi-card";
import { Lightbulb, AlertTriangle, Zap, TrendingUp, Droplets, Wind, Trash2, Leaf, BarChart3, Award, Target } from "lucide-react";
import type { SustainabilityState } from "../types";

export function CommandCenterView({ state, summary, onAckAlert }: {
  state: SustainabilityState;
  summary: SustainabilityState["summary"];
  onAckAlert: (id: string) => void;
}) {
  if (!summary) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
        <KpiCard label="Total Energy" value={`${(summary.totalEnergyKwh / 1000).toFixed(1)}k`} sub="kWh" icon={Zap} color="text-amber-400" bg="bg-amber-500/10" trend={summary.totalEnergyKwh > 40000 ? "up" : "neutral"} />
        <KpiCard label="Live Power Demand" value={`${summary.livePowerDemandKw.toFixed(0)}`} sub="kW" icon={TrendingUp} color="text-orange-400" bg="bg-orange-500/10" trend={summary.livePowerDemandKw > 2000 ? "up" : "neutral"} />
        <KpiCard label="Water Consumption" value={`${(summary.totalWaterL / 1000).toFixed(0)}`} sub="kL" icon={Droplets} color="text-blue-400" bg="bg-blue-500/10" trend={summary.totalWaterL > 50000 ? "up" : "neutral"} />
        <KpiCard label="Carbon Emissions" value={`${(summary.totalCO2Kg / 1000).toFixed(1)}`} sub="tCO₂e" icon={Wind} color={summary.totalCO2Kg > 22000 ? "text-red-400" : "text-emerald-400"} bg="bg-red-500/10" trend={summary.totalCO2Kg > 22000 ? "up" : "down"} />
        <KpiCard label="Waste Generated" value={summary.wasteGeneratedKg} sub="kg" icon={Trash2} color="text-purple-400" bg="bg-purple-500/10" trend={summary.wasteGeneratedKg > 400 ? "up" : "down"} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiCard label="Renewable Energy" value={`${summary.renewablePct}%`} sub="of total mix" icon={Leaf} color="text-emerald-400" bg="bg-emerald-500/10" trend={summary.renewablePct > 30 ? "up" : "neutral"} />
        <KpiCard label="Operational Efficiency" value={`${summary.operationalEfficiency}%`} sub="fleet average" icon={BarChart3} color={summary.operationalEfficiency >= 70 ? "text-emerald-400" : "text-amber-400"} bg="bg-primary/10" trend={summary.operationalEfficiency >= 70 ? "up" : "down"} />
        <KpiCard label="Sustainability Score" value={summary.sustainabilityScore} sub="/100" icon={Award} color={summary.sustainabilityScore >= 70 ? "text-emerald-400" : "text-amber-400"} bg="bg-emerald-500/10" trend={summary.sustainabilityScore >= 70 ? "up" : "neutral"} />
        <KpiCard label="Net-Zero Progress" value={`${summary.netZeroProgress}%`} sub="toward 2035 target" icon={Target} color="text-cyan-400" bg="bg-cyan-500/10" trend={summary.netZeroProgress > 40 ? "up" : "neutral"} />
      </div>

      {state.recommendations.length > 0 && (
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Top AI Recommendations</h3>
            <div className="space-y-1.5">
              {state.recommendations.slice(0, 4).map((rec) => (
                <div key={rec.id} className="flex items-start gap-2 rounded-md bg-primary/5 px-2 py-1.5">
                  <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-card-foreground">{rec.title}</span>
                      <Badge variant="outline" className={cn("text-[8px]", rec.priority === "p0" ? "text-red-400 border-red-500/20" : rec.priority === "p1" ? "text-orange-400" : "text-muted-foreground")}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      ${rec.estimatedCostSavings.toLocaleString()} savings &middot; {rec.estimatedCarbonReduction.toLocaleString()} kg CO₂ reduction
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {state.alerts.filter((a) => !a.acknowledged).length > 0 && (
        <Card className="border-amber-500/20">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Active Alerts ({state.alerts.filter((a) => !a.acknowledged).length})</h3>
            <div className="space-y-1.5">
              {state.alerts.filter((a) => !a.acknowledged).slice(0, 5).map((alert) => (
                <div key={alert.id} className={cn(
                  "flex items-start gap-2 rounded-md px-2 py-1.5",
                  alert.severity === "critical" ? "bg-red-500/10" : alert.severity === "high" ? "bg-orange-500/10" : "bg-amber-500/10",
                )}>
                  <AlertTriangle className={cn("mt-0.5 h-3 w-3 shrink-0", alert.severity === "critical" ? "text-red-400" : "text-amber-400")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-card-foreground">{alert.title}</p>
                    <p className="text-[10px] text-muted-foreground">{alert.message.substring(0, 80)}...</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 shrink-0 text-[10px]" onClick={() => onAckAlert(alert.id)}>
                    Ack
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
