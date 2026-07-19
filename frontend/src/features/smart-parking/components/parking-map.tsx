"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, RotateCcw, Car, Zap, Wheelchair, Star, Bus, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ParkingLot, ParkingLotStatus, TrafficRoad } from "../types";

interface ParkingMapProps {
  lots: ParkingLot[];
  statuses: Map<string, ParkingLotStatus>;
  roads: TrafficRoad[];
  selectedLotId: string | null;
  selectedRoadId: string | null;
  onSelectLot: (id: string) => void;
  onSelectRoad: (id: string) => void;
  className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  vip: Star, ev_charging: Zap, accessible: Wheelchair, bus: Bus, rideshare: Bike,
};

const typeColors: Record<string, string> = {
  general: "#3b82f6", vip: "#f59e0b", staff: "#8b5cf6", accessible: "#22c55e",
  ev_charging: "#06b6d4", overflow: "#f97316", media: "#ec4899", bus: "#a855f7",
  rental: "#14b8a6", rideshare: "#eab308",
};

export function ParkingMap({
  lots, statuses, roads, selectedLotId, selectedRoadId, onSelectLot, onSelectRoad, className,
}: ParkingMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const roadColors = useMemo(() => {
    const colors: Record<string, string> = {};
    for (const road of roads) {
      colors[road.id] = road.status === "closed" ? "#dc2626" : road.congestionLevel === "severe" ? "#ef4444" : road.congestionLevel === "high" ? "#f97316" : road.congestionLevel === "moderate" ? "#eab308" : "#22c55e";
    }
    return colors;
  }, [roads]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(3, z - e.deltaY * 0.002)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

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
        onWheel={handleWheel} onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        role="img" aria-label="Interactive parking lot map"
      >
        <svg viewBox="-3 -3 106 88" className="h-full w-full transition-transform" style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}>
          <rect x={-3} y={-3} width={106} height={88} rx={6} fill="hsl(var(--muted))" opacity={0.1} />

          {roads.map((road) => (
            <g key={road.id}>
              <line
                x1={road.coordinates.x1} y1={road.coordinates.y1}
                x2={road.coordinates.x2} y2={road.coordinates.y2}
                stroke={roadColors[road.id]} strokeWidth={road.status === "closed" ? 5 : 3.5}
                strokeOpacity={0.7} strokeLinecap="round"
                className={cn("cursor-pointer transition-all", hovered === road.id && "stroke-[5]")}
                onClick={() => onSelectRoad(road.id)}
                onMouseEnter={() => setHovered(road.id)} onMouseLeave={() => setHovered(null)}
                role="button" tabIndex={0} aria-label={`${road.name}: ${road.status}, ${road.congestionLevel} congestion`}
                onKeyDown={(e) => { if (e.key === "Enter") onSelectRoad(road.id); }}
              />
              <text
                x={(road.coordinates.x1 + road.coordinates.x2) / 2}
                y={(road.coordinates.y1 + road.coordinates.y2) / 2 - 2}
                textAnchor="middle" className="fill-muted-foreground text-[2.5px] pointer-events-none"
              >
                {road.name.length > 18 ? road.name.slice(0, 18) + "..." : road.name}
              </text>
            </g>
          ))}

          {lots.map((lot) => {
            const s = statuses.get(lot.id);
            const color = typeColors[lot.type] ?? "#6b7280";
            const Icon = typeIcons[lot.type];
            const isSelected = selectedLotId === lot.id;
            const isHovered = hovered === lot.id;
            return (
              <g key={lot.id}>
                <rect
                  x={lot.coordinates.x} y={lot.coordinates.y}
                  width={lot.coordinates.width} height={lot.coordinates.height}
                  rx={3}
                  fill={color}
                  fillOpacity={s ? 0.15 + (s.occupancyPercent / 100) * 0.55 : 0.3}
                  stroke={isSelected ? "#fff" : isHovered ? color : "hsl(var(--border))"}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 0.8}
                  className="cursor-pointer transition-all"
                  onClick={() => onSelectLot(lot.id)}
                  onMouseEnter={() => setHovered(lot.id)} onMouseLeave={() => setHovered(null)}
                  role="button" tabIndex={0}
                  aria-label={`${lot.name}: ${s?.occupancyPercent ?? "?"}% occupied`}
                  aria-selected={isSelected}
                  onKeyDown={(e) => { if (e.key === "Enter") onSelectLot(lot.id); }}
                />
                {lot.coordinates.width > 10 && lot.coordinates.height > 6 && (
                  <text
                    x={lot.coordinates.x + lot.coordinates.width / 2}
                    y={lot.coordinates.y + lot.coordinates.height / 2}
                    textAnchor="middle" dominantBaseline="central"
                    className="fill-foreground text-[3px] font-medium pointer-events-none"
                  >
                    {s ? `${s.occupancyPercent}%` : ""}
                  </text>
                )}
                {lot.coordinates.width > 6 && (
                  <text
                    x={lot.coordinates.x + lot.coordinates.width / 2}
                    y={lot.coordinates.y - 1.5}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[2.8px] pointer-events-none"
                  >
                    {lot.name.length > 14 ? lot.name.slice(0, 14) + "..." : lot.name}
                  </text>
                )}
                {Icon && (
                  <foreignObject
                    x={lot.coordinates.x + 1} y={lot.coordinates.y + 1}
                    width={8} height={8}
                  >
                    <Icon className="h-2 w-2 text-white/70" />
                  </foreignObject>
                )}
              </g>
            );
          })}

          {selectedLotId && (
            <rect
              x={lots.find((l) => l.id === selectedLotId)?.coordinates.x ?? 0}
              y={lots.find((l) => l.id === selectedLotId)?.coordinates.y ?? 0}
              width={lots.find((l) => l.id === selectedLotId)?.coordinates.width ?? 0}
              height={lots.find((l) => l.id === selectedLotId)?.coordinates.height ?? 0}
              rx={3} fill="none" stroke="#fff" strokeWidth={2.5}
              strokeDasharray="4 3" className="animate-pulse pointer-events-none"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
