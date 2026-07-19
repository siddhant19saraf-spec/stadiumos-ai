"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Map as MapIcon } from "lucide-react";
import type { Venue } from "../types";

interface TournamentMapProps {
  venues: Venue[];
  className?: string;
}

const statusColors: Record<string, string> = {
  ready: "#22c55e",
  preparing: "#eab308",
  maintenance: "#ef4444",
  emergency: "#ef4444",
  post_event_cleanup: "#3b82f6",
  inactive: "#6b7280",
};
export function TournamentMap({ venues, className }: TournamentMapProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapIcon className="h-4 w-4" />
          Venue Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 100 60" className="h-full w-full rounded-md border bg-card" role="img" aria-label="Tournament venue map">
          <rect x={0} y={0} width={100} height={60} rx={4} fill="hsl(var(--muted))" opacity={0.15} />

          {venues.map((venue) => {
            const { x, y } = venue.coordinates;
            const color = statusColors[venue.status] ?? "#6b7280";
            const isLow = venue.readiness.overall < 75;
            return (
              <g key={venue.id}>
                <rect
                  x={x - 5} y={y - 3} width={10} height={6} rx={2}
                  fill={color} fillOpacity={isLow ? 0.4 : 0.6}
                  stroke={color} strokeWidth={1.5}
                  className="transition-all"
                />
                <text
                  x={x} y={y + 1} textAnchor="middle" dominantBaseline="central"
                  className="fill-white text-[3px] font-bold"
                >
                  {venue.name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}
                </text>
                <text
                  x={x} y={y + 5} textAnchor="middle"
                  className="fill-muted-foreground text-[2.5px]"
                >
                  {venue.readiness.overall}% · {venue.capacity.toLocaleString()}
                </text>
                {isLow && (
                  <text
                    x={x - 3} y={y - 3}
                    className="fill-red-400 text-[3px] font-bold"
                  >
                    !
                  </text>
                )}
              </g>
            );
          })}

          <text x={50} y={58} textAnchor="middle" className="fill-muted-foreground text-[3px]">
            Tournament Venue Overview — 8 Venues Across Spain
          </text>
        </svg>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          {Object.entries(statusColors).map(([key, color]) => (
            <span key={key} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {key.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

