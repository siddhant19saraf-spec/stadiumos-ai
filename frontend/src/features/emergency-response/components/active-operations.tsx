"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, MapPin, Users, Clock, Brain } from "lucide-react";
import type { Incident, ResponseTeam } from "../types";

interface ActiveOperationsProps {
  incidents: Incident[];
  teams: ResponseTeam[];
  className?: string;
}

export function ActiveOperations({ incidents, teams, className }: ActiveOperationsProps) {
  const active = useMemo(
    () => incidents.filter((i) => i.status !== "resolved" && i.status !== "contained" && i.assignedTeam),
    [incidents],
  );
  const dispatchedTeams = teams.filter((t) => t.status === "dispatched" || t.status === "on_scene");

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-emerald-400" />
          Active Operations
          <span className="ml-auto text-xs font-normal text-muted-foreground">{active.length} ops</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] space-y-3 overflow-y-auto">
        {active.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">No active operations</div>
        )}
        {active.map((inc) => {
          const team = dispatchedTeams.find((t) => t.incidentId === inc.id);
          return (
            <div key={inc.id} className="rounded-md border bg-gradient-to-r from-emerald-500/5 to-transparent p-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-card-foreground">{inc.title}</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-[10px] text-emerald-400">
                  {inc.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{inc.location}</span>
                {team && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{team.name}</span>}
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.round((Date.now() - new Date(inc.reportedAt).getTime()) / 60000)}m elapsed</span>
                <span className="flex items-center gap-1"><Brain className="h-3 w-3" />Resolve ETA: {inc.estimatedResolutionMinutes}m</span>
              </div>
              {team && (
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">Leader: {team.leader}</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{team.members} members</span>
                  {team.estimatedArrivalMinutes > 0 && (
                    <span className="text-amber-400">ETA: {team.estimatedArrivalMinutes} min</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
