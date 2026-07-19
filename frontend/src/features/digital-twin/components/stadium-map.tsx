"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StadiumZone, ZoneLiveStatus, LayerConfig, MapEntity } from "../types";
import { visualizationEngine } from "../services/visualization-engine";
import { ZONE_CAPACITIES } from "../constants";

interface StadiumMapProps {
  zones: StadiumZone[];
  statuses: Map<string, ZoneLiveStatus>;
  layers: LayerConfig[];
  entities: MapEntity[];
  selectedZoneId: string | null;
  highlightedAssetId: string | null;
  onSelectZone: (id: string) => void;
  className?: string;
}

export function StadiumMap({
  zones, statuses, layers, entities, selectedZoneId, highlightedAssetId, onSelectZone, className,
}: StadiumMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const enabledLayerIds = useMemo(() => new Set(layers.filter((l) => l.enabled).map((l) => l.id)), [layers]);

  const zoneColors = useMemo(() => {
    const colors: Record<string, { fill: string; opacity: number; stroke: string }> = {};
    for (const zone of zones) {
      const s = statuses.get(zone.id);
      const pct = s?.occupancyPercent ?? 0;
      const crowdEnabled = enabledLayerIds.has("crowd_density");
      colors[zone.id] = {
        fill: crowdEnabled ? visualizationEngine.getHeatmapColor(pct) : "hsl(var(--muted))",
        opacity: crowdEnabled ? visualizationEngine.getZoneOpacity(pct) : 0.15,
        stroke: selectedZoneId === zone.id ? "#fff" : hovered === zone.id ? "hsl(var(--primary))" : "hsl(var(--border))",
      };
    }
    return colors;
  }, [zones, statuses, enabledLayerIds, selectedZoneId, hovered]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(3, z - e.deltaY * 0.002)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const visibleEntities = useMemo(
    () => entities.filter((e) => enabledLayerIds.has(e.layer)),
    [entities, enabledLayerIds],
  );

  const entityColors: Record<string, string> = useMemo(() => ({
    security_teams: "#f59e0b", medical_teams: "#ef4444", incidents: "#dc2626",
  }), []);

  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-card", className)}>
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(3, z + 0.2))} aria-label="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} aria-label="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label="Reset view">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div
        className="h-full w-full"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        role="img"
        aria-label="Interactive stadium digital twin map"
      >
        <svg
          viewBox="-5 -5 110 100"
          className="h-full w-full transition-transform"
          style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
        >
          <rect x={-5} y={-5} width={110} height={110} rx={6} fill="hsl(var(--muted))" opacity={0.1} />

          {zones.map((zone) => {
            const c = zoneColors[zone.id]!;
            const s = statuses.get(zone.id);
            const cap = ZONE_CAPACITIES[zone.id] ?? 0;
            return (
              <g key={zone.id}>
                <rect
                  x={zone.coordinates.x} y={zone.coordinates.y}
                  width={zone.coordinates.width} height={zone.coordinates.height}
                  rx={3}
                  fill={c.fill}
                  fillOpacity={c.opacity}
                  stroke={c.stroke}
                  strokeWidth={selectedZoneId === zone.id ? 2.5 : hovered === zone.id ? 2 : 0.8}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => onSelectZone(zone.id)}
                  onMouseEnter={() => setHovered(zone.id)}
                  onMouseLeave={() => setHovered(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${zone.name}: ${s?.occupancyPercent.toFixed(0) ?? "?"}% occupied`}
                  aria-selected={selectedZoneId === zone.id}
                  onKeyDown={(e) => { if (e.key === "Enter") onSelectZone(zone.id); }}
                />
                {zone.coordinates.width > 8 && zone.coordinates.height > 5 && (
                  <text
                    x={zone.coordinates.x + zone.coordinates.width / 2}
                    y={zone.coordinates.y + zone.coordinates.height / 2}
                    textAnchor="middle" dominantBaseline="central"
                    className="fill-foreground text-[3px] font-medium pointer-events-none"
                  >
                    {s ? `${s.occupancyPercent.toFixed(0)}%` : ""}
                  </text>
                )}
                {zone.coordinates.width > 6 && (
                  <text
                    x={zone.coordinates.x + zone.coordinates.width / 2}
                    y={zone.coordinates.y - 1.2}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[2.5px] pointer-events-none"
                  >
                    {zone.name.length > 12 ? zone.name.slice(0, 12) : zone.name}
                  </text>
                )}
              </g>
            );
          })}

          {selectedZoneId && (
            <rect
              x={zones.find((z) => z.id === selectedZoneId)?.coordinates.x ?? 0}
              y={zones.find((z) => z.id === selectedZoneId)?.coordinates.y ?? 0}
              width={zones.find((z) => z.id === selectedZoneId)?.coordinates.width ?? 0}
              height={zones.find((z) => z.id === selectedZoneId)?.coordinates.height ?? 0}
              rx={3} fill="none" stroke="#fff" strokeWidth={2.5}
              strokeDasharray="4 3" className="animate-pulse pointer-events-none"
            />
          )}

          {visibleEntities.map((e) => {
            const color = entityColors[e.layer] ?? "#888";
            return (
              <g key={e.id}>
                <circle
                  cx={e.coordinates.x} cy={e.coordinates.y} r={2.5}
                  fill={color} fillOpacity={0.8}
                  stroke={highlightedAssetId === e.id ? "#fff" : color}
                  strokeWidth={highlightedAssetId === e.id ? 2 : 0.5}
                  className={cn("cursor-pointer transition-all", e.pulse && "animate-pulse")}
                  onMouseEnter={() => setHovered(e.id)}
                  onMouseLeave={() => setHovered(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={e.label}
                  onKeyDown={(ev) => { if (ev.key === "Enter") onSelectZone(e.zoneId); }}
                />
                <text
                  x={e.coordinates.x} y={e.coordinates.y + 4}
                  textAnchor="middle" className="fill-muted-foreground text-[2px] pointer-events-none"
                >
                  {e.label.length > 15 ? e.label.slice(0, 15) + "..." : e.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
