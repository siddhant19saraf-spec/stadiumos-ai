// @ts-nocheck
"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, RotateCcw, Timer, Users, ShoppingBag, UtensilsCrossed, Wine, Shield, LogIn, Ticket, Info, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QueuePoint, QueuePointStatus } from "../types";

interface QueueMapProps {
  points: QueuePoint[];
  statuses: Map<string, QueuePointStatus>;
  selectedQueueId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  food_counter: UtensilsCrossed, beverage_counter: Wine, merchandise: ShoppingBag,
  restroom: Users, security: Shield, entry_gate: LogIn,
  customer_service: Users, atm: CreditCard, ticket_booth: Ticket, information: Info,
};

const typeColors: Record<string, string> = {
  food_counter: "#f59e0b", beverage_counter: "#06b6d4", merchandise: "#ec4899",
  restroom: "#8b5cf6", security: "#ef4444", entry_gate: "#22c55e",
  customer_service: "#3b82f6", atm: "#14b8a6", ticket_booth: "#f97316", information: "#6b7280",
};

export function QueueMap({ points, statuses, selectedQueueId, onSelect, className }: QueueMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(3, z + 0.2))} aria-label="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} aria-label="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label="Reset view"><RotateCcw className="h-3.5 w-3.5" /></Button>
      </div>

      <div
        className="h-full w-full"
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        role="img" aria-label="Interactive stadium queue map"
      >
        <svg viewBox="0 0 100 83" className="h-full w-full transition-transform" style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}>
          <rect x={0} y={0} width={100} height={83} rx={6} fill="hsl(var(--muted))" opacity={0.1} />

          {points.map((point) => {
            const s = statuses.get(point.id);
            const color = typeColors[point.type] ?? "#6b7280";
            const isSelected = selectedQueueId === point.id;
            const isHovered = hovered === point.id;
            const Icon = typeIcons[point.type];
            return (
              <g key={point.id}>
                <rect
                  x={point.coordinates.x} y={point.coordinates.y}
                  width={point.coordinates.width} height={point.coordinates.height}
                  rx={2}
                  fill={color}
                  fillOpacity={s ? 0.15 + (s.capacityUtilization / 100) * 0.55 : 0.3}
                  stroke={isSelected ? "#fff" : isHovered ? color : "hsl(var(--border))"}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 0.6}
                  className="cursor-pointer transition-all"
                  onClick={() => onSelect(point.id)}
                  onMouseEnter={() => setHovered(point.id)} onMouseLeave={() => setHovered(null)}
                  role="button" tabIndex={0}
                  aria-label={`${point.name}: ${s?.estimatedWaitMin ?? "?"} min wait, ${s?.currentLength ?? "?"} in queue`}
                  aria-selected={isSelected}
                  onKeyDown={(e) => { if (e.key === "Enter") onSelect(point.id); }}
                />
                {point.coordinates.width > 9 && point.coordinates.height > 5 && (
                  <text
                    x={point.coordinates.x + point.coordinates.width / 2}
                    y={point.coordinates.y + point.coordinates.height / 2}
                    textAnchor="middle" dominantBaseline="central"
                    className="fill-foreground text-[2.5px] font-medium pointer-events-none"
                  >
                    {s ? `${s.estimatedWaitMin}min` : ""}
                  </text>
                )}
                <text
                  x={point.coordinates.x + point.coordinates.width / 2}
                  y={point.coordinates.y - 1.2}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[2.5px] pointer-events-none"
                >
                  {point.name.length > 14 ? point.name.slice(0, 14) + "..." : point.name}
                </text>
                {Icon && (
                  <foreignObject x={point.coordinates.x + 1} y={point.coordinates.y + 1} width={6} height={6}>
                    <Icon className="h-1.5 w-1.5 text-white/70" />
                  </foreignObject>
                )}
              </g>
            );
          })}

          {selectedQueueId && points.find((p) => p.id === selectedQueueId) && (
            <rect
              x={points.find((p) => p.id === selectedQueueId)!.coordinates.x}
              y={points.find((p) => p.id === selectedQueueId)!.coordinates.y}
              width={points.find((p) => p.id === selectedQueueId)!.coordinates.width}
              height={points.find((p) => p.id === selectedQueueId)!.coordinates.height}
              rx={2} fill="none" stroke="#fff" strokeWidth={2.5}
              strokeDasharray="4 3" className="animate-pulse pointer-events-none"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

