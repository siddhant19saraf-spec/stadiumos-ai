"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import type { SustainabilityState } from "../types";

const categories = ["energy", "water", "waste", "carbon", "operations"] as const;

export function RecommendationsView({ state }: { state: SustainabilityState }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? state.recommendations : state.recommendations.filter((r) => r.category === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        {categories.map((c) => (
          <Button key={c} variant={filter === c ? "default" : "ghost"} size="sm" className="h-7 text-[10px] capitalize" onClick={() => setFilter(c)}>{c}</Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No recommendations in this category
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((rec) => (
            <Card key={rec.id} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-sm font-medium text-card-foreground">{rec.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", rec.priority === "p0" ? "text-red-400 border-red-500/20" : rec.priority === "p1" ? "text-orange-400 border-orange-500/20" : "text-muted-foreground")}>
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{rec.category}</Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
                  <div className="rounded-md bg-amber-500/5 p-1.5">
                    <p className="text-muted-foreground">Cost Savings</p>
                    <p className="font-medium tabular-nums text-amber-400">${rec.estimatedCostSavings.toLocaleString()}</p>
                  </div>
                  <div className="rounded-md bg-emerald-500/5 p-1.5">
                    <p className="text-muted-foreground">Carbon Reduction</p>
                    <p className="font-medium tabular-nums text-emerald-400">{rec.estimatedCarbonReduction.toLocaleString()} kg</p>
                  </div>
                  <div className="rounded-md bg-blue-500/5 p-1.5">
                    <p className="text-muted-foreground">ROI</p>
                    <p className="font-medium tabular-nums text-blue-400">{rec.roi}x</p>
                  </div>
                  <div className="rounded-md bg-purple-500/5 p-1.5">
                    <p className="text-muted-foreground">Payback</p>
                    <p className="font-medium tabular-nums text-purple-400">{rec.paybackDays} days</p>
                  </div>
                </div>
                {rec.automationPossible && (
                  <div className="mt-1.5 rounded bg-primary/5 px-2 py-1 text-[10px] text-primary">
                    AI automation available — can be implemented without manual intervention
                  </div>
                )}
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                    AI Reasoning
                  </summary>
                  <div className="mt-1 space-y-0.5 pl-2">
                    {rec.reasoning.map((r, i) => (
                      <p key={i} className="text-[10px] text-muted-foreground">• {r}</p>
                    ))}
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
