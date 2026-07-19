"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DENSITY_THRESHOLDS } from "../constants";
import type { StadiumZone } from "../types";

function getColor(density: number): string {
  if (density >= DENSITY_THRESHOLDS.critical.max) return DENSITY_THRESHOLDS.critical.color;
  if (density >= DENSITY_THRESHOLDS.congested.max) return DENSITY_THRESHOLDS.congested.color;
  if (density >= DENSITY_THRESHOLDS.moderate.max) return DENSITY_THRESHOLDS.moderate.color;
  return DENSITY_THRESHOLDS.normal.color;
}

function getOpacity(density: number): number {
  return 0.25 + (density / 100) * 0.65;
}

interface CrowdHeatmapProps {
  zones: StadiumZone[];
  className?: string;
}

export function CrowdHeatmap({ zones, className }: CrowdHeatmapProps) {
  const [hovered, setHovered] = useState<StadiumZone | null>(null);

  const gates = zones.filter((z) => z.type === "gate" || z.type === "exit");
  const sections = zones.filter((z) => z.type === "section" || z.type === "vip");
  const concourses = zones.filter((z) => z.type === "concourse");
  const concessions = zones.filter((z) => z.type === "concession");

  const renderZone = (zone: StadiumZone) => (
    <g key={zone.id}>
      <rect
        x={zone.location.x}
        y={zone.location.y}
        width={zone.location.width}
        height={zone.location.height}
        rx={4}
        fill={getColor(zone.densityPercent)}
        fillOpacity={getOpacity(zone.densityPercent)}
        stroke={hovered?.id === zone.id ? getColor(zone.densityPercent) : "hsl(var(--border))"}
        strokeWidth={hovered?.id === zone.id ? 2 : 1}
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => setHovered(zone)}
        onMouseLeave={() => setHovered(null)}
      />
      <text
        x={zone.location.x + zone.location.width / 2}
        y={zone.location.y + zone.location.height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[10px] font-medium"
        pointerEvents="none"
      >
        {zone.densityPercent.toFixed(0)}%
      </text>
    </g>
  );

  return (
    <div className={cn("relative", className)}>
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium text-card-foreground">
          Stadium Heatmap
        </h3>
        <svg viewBox="0 0 100 62" className="h-full w-full">
          <rect x={0} y={0} width={100} height={62} rx={6} fill="hsl(var(--muted))" opacity={0.3} />

          <rect x={34} y={0} width={32} height={5} rx={2} fill="hsl(var(--muted))" opacity={0.4} />
          <text x={50} y={3} textAnchor="middle" className="fill-muted-foreground text-[5px]">
            South Exit
          </text>

          {concourses.map(renderZone)}

          {sections.map(renderZone)}

          {gates.map(renderZone)}
          {concessions.map(renderZone)}

          <rect x={36} y={53} width={28} height={5} rx={2} fill="hsl(var(--muted))" opacity={0.4} />
          <text x={50} y={56} textAnchor="middle" className="fill-muted-foreground text-[5px]">
            North Exit
          </text>

          <text x={50} y={35} textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground text-[4px] opacity-50">
            PITCH
          </text>
        </svg>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Object.entries(DENSITY_THRESHOLDS).map(([key, t]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: t.color, opacity: 0.7 }}
                />
                <span className="text-xs text-muted-foreground">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {hovered && (
          <div className="mt-3 rounded-md border bg-card p-3 text-xs">
            <div className="mb-1 font-medium text-card-foreground">{hovered.name}</div>
            <div className="space-y-0.5 text-muted-foreground">
              <p>Occupancy: {hovered.currentCount.toLocaleString()} / {hovered.capacity.toLocaleString()} ({hovered.densityPercent.toFixed(0)}%)</p>
              <p>Status: <span className="capitalize">{hovered.status}</span></p>
              <p>Safety Score: {hovered.safetyScore.toFixed(0)}/100</p>
              {hovered.waitTimeMinutes > 0 && <p>Wait Time: ~{hovered.waitTimeMinutes} min</p>}
              {hovered.prediction30m !== undefined && <p>Predicted 30m: {hovered.prediction30m}% density</p>}
              <p className="mt-1 font-medium text-card-foreground">Recommended: {hovered.densityPercent > 65 ? "Reduce inflow via staff deployment" : "Continue monitoring"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
