"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Brain, AlertTriangle, MapPin, Clock, Shield, Target, Route, Users } from "lucide-react";
import type { Incident } from "../types";

interface IncidentDashboardProps {
  incident: Incident | null;
  className?: string;
}

const severityColor: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10",
  high: "text-orange-400 bg-orange-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  low: "text-emerald-400 bg-emerald-500/10",
};

export function IncidentDashboard({ incident, className }: IncidentDashboardProps) {
  if (!incident) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="text-sm">Incident Detail</CardTitle></CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          Select an incident to view details
        </CardContent>
      </Card>
    );
  }

  const { aiAnalysis } = incident;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Incident Detail</span>
          <Badge variant="outline" className={cn("text-[10px]", severityColor[incident.severity])}>
            {incident.severity.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] space-y-4 overflow-y-auto">
        <div>
          <h3 className="text-sm font-medium text-card-foreground">{incident.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{incident.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted/30 p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> Location
            </div>
            <p className="text-xs font-medium text-card-foreground">{incident.location}</p>
          </div>
          <div className="rounded-md bg-muted/30 p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" /> Reported
            </div>
            <p className="text-xs font-medium text-card-foreground">{new Date(incident.reportedAt).toLocaleTimeString()}</p>
          </div>
          <div className="rounded-md bg-muted/30 p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Shield className="h-3 w-3" /> Status
            </div>
            <p className="text-xs font-medium capitalize text-card-foreground">{incident.status.replace(/_/g, " ")}</p>
          </div>
          <div className="rounded-md bg-muted/30 p-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" /> Team
            </div>
            <p className="text-xs font-medium text-card-foreground">{incident.assignedTeam ?? "Unassigned"}</p>
          </div>
        </div>

        <div className="rounded-md border bg-gradient-to-r from-purple-500/5 to-transparent p-3">
          <div className="mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-card-foreground">AI Analysis</span>
            <Badge variant="outline" className="ml-auto bg-purple-500/10 text-[10px] text-purple-400">
              {incident.aiConfidence}% confidence
            </Badge>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">{aiAnalysis.analysisSummary}</p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Response ETA:</span>
              <span className="font-medium text-card-foreground">{aiAnalysis.estimatedResponseMinutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Escalation:</span>
              <span className={cn("font-medium", aiAnalysis.escalationProbability > 60 ? "text-red-400" : "text-amber-400")}>
                {aiAnalysis.escalationProbability}%
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-1.5 text-xs font-medium text-card-foreground">Recommended Actions</h4>
          <div className="space-y-1">
            {aiAnalysis.recommendedActions.slice(0, 4).map((action, idx) => (
              <div key={idx} className="flex items-start gap-2 rounded-md bg-muted/20 px-2 py-1.5 text-[10px]">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] text-primary">
                  {idx + 1}
                </span>
                <span className="text-muted-foreground">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {aiAnalysis.evacuationRoutes.length > 0 && (
          <div>
            <h4 className="mb-1.5 flex items-center gap-1 text-xs font-medium text-card-foreground">
              <Route className="h-3 w-3" /> Evacuation Routes
            </h4>
            <div className="flex flex-wrap gap-1">
              {aiAnalysis.evacuationRoutes.map((route) => (
                <span key={route} className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-400">
                  {route}
                </span>
              ))}
            </div>
          </div>
        )}

        {aiAnalysis.resourceShortages.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-medium text-red-400">Resource Shortages</h4>
            <div className="space-y-1">
              {aiAnalysis.resourceShortages.map((rs) => (
                <div key={rs} className="flex items-center gap-1.5 rounded-md bg-red-500/5 px-2 py-1 text-[10px] text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  {rs}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
