"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Users, MapPin, Clock } from "lucide-react";
import type { ResponseTeam } from "../types";

interface ResponseTeamsProps {
  teams: ResponseTeam[];
  className?: string;
}

const statusColor: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-400",
  dispatched: "bg-amber-500/10 text-amber-400",
  on_scene: "bg-blue-500/10 text-blue-400",
  returning: "bg-slate-500/10 text-slate-400",
};

const teamIcons: Record<string, React.ElementType> = {
  medical_alpha: Users, medical_bravo: Users, security_alpha: Users,
  security_bravo: Users, fire_response: Users, hazmat: Users,
  evacuation: Users, engineering: Users, vip_protection: Users,
  crowd_management: Users, communications: Users, command: Users,
};

export function ResponseTeams({ teams, className }: ResponseTeamsProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          Response Teams
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[500px] space-y-2 overflow-y-auto">
        {teams.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">No teams configured</div>
        )}
        {teams.map((team) => {
          const Icon = teamIcons[team.type] ?? Users;
          return (
            <div
              key={team.id}
              className="flex items-start gap-3 rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-card-foreground">{team.name}</span>
                  <Badge variant="outline" className={cn("text-[10px]", statusColor[team.status])}>
                    {team.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{team.leader}</span>
                  <span>{team.members} members</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{team.location}</span>
                </div>
                {team.incidentId && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
                    <Clock className="h-3 w-3" />
                    Assigned · ETA {team.estimatedArrivalMinutes} min
                  </div>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {team.equipment.slice(0, 3).map((eq) => (
                    <span key={eq} className="rounded bg-muted/50 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                      {eq}
                    </span>
                  ))}
                  {team.equipment.length > 3 && (
                    <span className="text-[9px] text-muted-foreground">+{team.equipment.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
