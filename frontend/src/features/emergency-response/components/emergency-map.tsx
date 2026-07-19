"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Map as MapIcon } from "lucide-react";
import type { MapEntity, Incident } from "../types";

interface EmergencyMapProps {
  entities: MapEntity[];
  selectedIncident: Incident | null;
  onSelectEntity?: (id: string) => void;
  className?: string;
}

const entityColors: Record<string, string> = {
  incident: "#ef4444",
  medical_team: "#22c55e",
  security_team: "#3b82f6",
  fire_team: "#f97316",
  emergency_exit: "#22d3ee",
  blocked_area: "#dc2626",
  rally_point: "#a855f7",
  command_post: "#f59e0b",
};

const entityLabels: Record<string, string> = {
  incident: "Incident",
  medical_team: "Medical",
  security_team: "Security",
  fire_team: "Fire",
  emergency_exit: "Exit",
  blocked_area: "Blocked",
  rally_point: "Rally Point",
  command_post: "Command",
};

export function EmergencyMap({ entities, selectedIncident, onSelectEntity, className }: EmergencyMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const exits = entities.filter((e) => e.type === "emergency_exit");
  const rallyPoints = entities.filter((e) => e.type === "rally_point");
  const incidents = entities.filter((e) => e.type === "incident");
  const teams = entities.filter((e) => e.type !== "emergency_exit" && e.type !== "rally_point" && e.type !== "incident");
  const blocked = entities.filter((e) => e.type === "blocked_area");

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapIcon className="h-4 w-4" />
          Emergency Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 100 60" className="h-full w-full rounded-md border bg-card" role="img" aria-label={`Emergency incident map with ${entities.length} entities`}>
          <rect x={0} y={0} width={100} height={60} rx={4} fill="hsl(var(--muted))" opacity={0.15} />

          {blocked.map((e) => (
            <g key={e.id}>
              <rect
                x={e.coordinates.x - 4}
                y={e.coordinates.y - 3}
                width={8}
                height={6}
                fill={entityColors.blocked_area}
                fillOpacity={0.25}
                stroke={entityColors.blocked_area}
                strokeWidth={1.5}
                strokeDasharray="2 2"
                rx={2}
              />
              <text
                x={e.coordinates.x} y={e.coordinates.y}
                textAnchor="middle" dominantBaseline="central"
                className="fill-red-400 text-[3px] font-bold"
              >
                BLOCKED
              </text>
            </g>
          ))}

          {exits.map((e) => (
            <g key={e.id}>
              <rect
                x={e.coordinates.x - 2} y={e.coordinates.y - 1.5}
                width={4} height={3} fill={entityColors.emergency_exit} rx={0.5}
              />
              <text
                x={e.coordinates.x} y={e.coordinates.y - 2.5}
                textAnchor="middle" className="fill-cyan-400 text-[2.5px] font-medium"
              >
                {e.label}
              </text>
            </g>
          ))}

          {rallyPoints.map((e) => (
            <g key={e.id}>
              <polygon
                points={`${e.coordinates.x},${e.coordinates.y - 2} ${e.coordinates.x + 2},${e.coordinates.y + 1.5} ${e.coordinates.x - 2},${e.coordinates.y + 1.5}`}
                fill={entityColors.rally_point} fillOpacity={0.7}
              />
              <text
                x={e.coordinates.x} y={e.coordinates.y + 3}
                textAnchor="middle" className="fill-purple-400 text-[2.5px]"
              >
                {e.label}
              </text>
            </g>
          ))}

          {teams.map((e) => (
            <g key={e.id}>
              <circle
                cx={e.coordinates.x} cy={e.coordinates.y} r={2.5}
                fill={entityColors[e.type] ?? "#888"} fillOpacity={0.7}
                stroke={hovered === e.id ? "#fff" : entityColors[e.type]}
                strokeWidth={hovered === e.id ? 1.5 : 0.5}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHovered(e.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(e.id)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="button"
                aria-label={`${entityLabels[e.type] ?? e.type}: ${e.label}`}
                onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") onSelectEntity?.(e.id); }}
              />
              <text
                x={e.coordinates.x} y={e.coordinates.y + 4}
                textAnchor="middle" className="fill-muted-foreground text-[2.5px]"
              >
                {entityLabels[e.type] ?? e.type}
              </text>
            </g>
          ))}

          {incidents.map((e) => {
            const isSelected = selectedIncident?.id === e.id;
            const r = isSelected ? 4 : e.pulse ? 3.5 : 3;
            return (
              <g key={e.id}>
                <circle
                  cx={e.coordinates.x} cy={e.coordinates.y} r={r}
                  fill="#ef4444" fillOpacity={e.pulse ? 0.8 : 0.5}
                  stroke="#ef4444" strokeWidth={isSelected ? 2 : 1}
                  className={cn("cursor-pointer transition-all", e.pulse && "animate-pulse")}
                />
                {isSelected && (
                  <text
                    x={e.coordinates.x} y={e.coordinates.y - 5}
                    textAnchor="middle" className="fill-red-400 text-[3px] font-bold"
                  >
                    {e.label.length > 20 ? e.label.slice(0, 20) + "..." : e.label}
                  </text>
                )}
              </g>
            );
          })}

          <rect x={44} y={27} width={12} height={6} rx={1} fill="hsl(var(--muted))" fillOpacity={0.3} stroke="hsl(var(--border))" strokeWidth={0.5} />
          <text x={50} y={31} textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground text-[3px]">PITCH</text>

          <text x={50} y={58} textAnchor="middle" className="fill-muted-foreground text-[3px]">Stadium Emergency Overview</text>
        </svg>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          {Object.entries(entityLabels).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entityColors[key] }} />
              {label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

