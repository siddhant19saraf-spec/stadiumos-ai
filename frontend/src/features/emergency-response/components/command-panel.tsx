"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Send, ArrowUpCircle, Bell, Megaphone, Ban, Shuffle, CheckCircle,
} from "lucide-react";
import type { Incident, ResponseTeam } from "../types";

interface CommandPanelProps {
  incident: Incident | null;
  teams: ResponseTeam[];
  onCommand?: (type: string, incidentId: string, params: Record<string, string>) => void;
  className?: string;
}

const COMMANDS = [
  { type: "dispatch", label: "Dispatch Team", icon: Send, color: "text-amber-400 border-amber-500/30 hover:bg-amber-500/10", requiresIncident: true },
  { type: "escalate", label: "Escalate Incident", icon: ArrowUpCircle, color: "text-red-400 border-red-500/30 hover:bg-red-500/10", requiresIncident: true },
  { type: "notify", label: "Notify Authorities", icon: Bell, color: "text-purple-400 border-purple-500/30 hover:bg-purple-500/10", requiresIncident: true },
  { type: "broadcast", label: "Broadcast Message", icon: Megaphone, color: "text-blue-400 border-blue-500/30 hover:bg-blue-500/10", requiresIncident: false },
  { type: "close_area", label: "Close Area", icon: Ban, color: "text-orange-400 border-orange-500/30 hover:bg-orange-500/10", requiresIncident: true },
  { type: "reassign", label: "Reassign Teams", icon: Shuffle, color: "text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10", requiresIncident: true },
  { type: "resolve", label: "Resolve Incident", icon: CheckCircle, color: "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10", requiresIncident: true },
];

export function CommandPanel({ incident, teams, onCommand, className }: CommandPanelProps) {
  const availableTeams = teams.filter((t) => t.status === "available");

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Command Panel</span>
          {incident && (
            <Badge variant="outline" className="text-[9px]">
              {incident.id.split("-").slice(0, 2).join("-")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!incident ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Select an incident to access commands
          </div>
        ) : (
          <>
            <div className="mb-3 rounded-md bg-muted/30 p-2 text-xs">
              <span className="font-medium text-card-foreground">Active: </span>
              <span className="text-muted-foreground">{incident.title}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                const disabled = cmd.requiresIncident && (incident.status === "resolved" || incident.status === "contained");
                return (
                  <Button
                    key={cmd.type}
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className={cn("h-auto justify-start gap-2 px-3 py-2 text-[11px]", cmd.color, disabled && "opacity-30")}
                    onClick={() => {
                      const params: Record<string, string> = {};
                      if (cmd.type === "dispatch") {
                        if (availableTeams.length === 0) return;
                        params.teamId = availableTeams[0]!.id;
                      }
                      onCommand?.(cmd.type, incident.id, params);
                    }}
                    aria-label={cmd.label}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-left leading-tight">{cmd.label}</span>
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
