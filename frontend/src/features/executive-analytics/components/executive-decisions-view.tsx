"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import type { ExecutiveAnalyticsData } from "../types";

export function DecisionsView({ state, onImplement }: { state: ExecutiveAnalyticsData; onImplement: (id: string) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? state.decisions : state.decisions.filter((d) => d.status === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        <Button variant={filter === "active" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("active")}>Active</Button>
        <Button variant={filter === "implemented" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("implemented")}>Implemented</Button>
        <Button variant={filter === "in_review" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("in_review")}>In Review</Button>
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No decisions match filter
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((dec) => (
            <Card key={dec.id} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-sm font-medium text-card-foreground">{dec.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", dec.priority === "p0" ? "text-red-400 border-red-500/20" : dec.priority === "p1" ? "text-orange-400 border-orange-500/20" : "text-muted-foreground")}>
                        {dec.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{dec.status.replace(/_/g, " ")}</Badge>
                      <span className="text-[10px] text-muted-foreground">{dec.confidence}% confidence</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{dec.description}</p>
                  </div>
                  {dec.status === "active" && (
                    <Button variant={dec.requiresAuthorization ? "outline" : "ghost"} size="sm" className={cn("h-7 shrink-0 text-[10px]", dec.requiresAuthorization && "border-amber-500/30")} onClick={() => onImplement(dec.id)}>
                      {dec.requiresAuthorization ? "Authorize" : "Implement"}
                    </Button>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
                  <div className="rounded-md bg-blue-500/5 p-1.5">
                    <p className="text-muted-foreground">Cost Impact</p>
                    <p className="font-medium tabular-nums">${dec.estimatedCostImpact.toLocaleString()}</p>
                  </div>
                  <div className="rounded-md bg-purple-500/5 p-1.5">
                    <p className="text-muted-foreground">Time Impact</p>
                    <p className="font-medium tabular-nums">{dec.estimatedTimeImpact}</p>
                  </div>
                  <div className="rounded-md bg-primary/5 p-1.5">
                    <p className="text-muted-foreground">Module</p>
                    <p className="font-medium tabular-nums capitalize">{dec.sourceModule.replace(/-/g, " ")}</p>
                  </div>
                  <div className="rounded-md bg-amber-500/5 p-1.5">
                    <p className="text-muted-foreground">Authorization</p>
                    <p className="font-medium tabular-nums">{dec.requiresAuthorization ? "Required" : "Not Required"}</p>
                  </div>
                </div>
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                    AI Reasoning & Evidence
                  </summary>
                  <div className="mt-1 space-y-1 pl-2">
                    <p className="text-[10px] font-medium text-muted-foreground">Reasoning:</p>
                    {dec.reasoning.map((r, i) => (<p key={i} className="text-[10px] text-muted-foreground">• {r}</p>))}
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">Supporting Evidence:</p>
                    {dec.supportingEvidence.map((e, i) => (<p key={i} className="text-[10px] text-muted-foreground">• {e}</p>))}
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">Business Impact:</p>
                    <p className="text-[10px] text-muted-foreground">{dec.businessImpact}</p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">Operational Impact:</p>
                    <p className="text-[10px] text-muted-foreground">{dec.operationalImpact}</p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">Risk Assessment:</p>
                    <p className="text-[10px] text-muted-foreground">{dec.riskAssessment}</p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">Alternative Options:</p>
                    {dec.alternativeOptions.map((a, i) => (<p key={i} className="text-[10px] text-muted-foreground">• {a}</p>))}
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
