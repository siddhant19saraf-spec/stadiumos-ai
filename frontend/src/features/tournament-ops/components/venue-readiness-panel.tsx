"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Building2, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import type { Venue } from "../types";
import { READINESS_CATEGORIES } from "../constants";

interface VenueReadinessPanelProps {
  venues: Venue[];
  onSelect?: (id: string) => void;
  className?: string;
}

export function VenueReadinessPanel({ venues, onSelect, className }: VenueReadinessPanelProps) {
  const sorted = [...venues].sort((a, b) => a.readiness.overall - b.readiness.overall);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4" />
          Venue Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[500px] space-y-3 overflow-y-auto">
        {sorted.map((venue) => {
          const score = venue.readiness.overall;
          const scoreColor = score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500";
          const statusColor = venue.status === "ready" ? "bg-emerald-500/10 text-emerald-400" :
            venue.status === "preparing" ? "bg-amber-500/10 text-amber-400" :
            venue.status === "maintenance" ? "bg-red-500/10 text-red-400" :
            "bg-slate-500/10 text-slate-400";

          return (
            <div
              key={venue.id}
              className="cursor-pointer rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3 transition-colors hover:bg-muted/20"
              onClick={() => onSelect?.(venue.id)}
              role="button"
              tabIndex={0}
              aria-label={`Venue: ${venue.name}`}
              onKeyDown={(e) => e.key === "Enter" && onSelect?.(venue.id)}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground">{venue.name}</span>
                <Badge variant="outline" className={cn("text-[10px]", statusColor)}>
                  {venue.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{venue.city} · {venue.capacity.toLocaleString()} capacity</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-all", scoreColor)} style={{ width: `${score}%` }} />
                </div>
                <span className={cn("text-xs font-semibold", score >= 85 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-red-400")}>
                  {score}%
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {READINESS_CATEGORIES.filter((c) => venue.readiness[c.key] < 75).slice(0, 3).map((cat) => (
                  <span key={cat.key} className="flex items-center gap-1 rounded bg-red-500/5 px-1.5 py-0.5 text-[9px] text-red-400">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {cat.label}: {venue.readiness[cat.key]}%
                  </span>
                ))}
                {venue.currentEvent && (
                  <span className="flex items-center gap-1 rounded bg-blue-500/5 px-1.5 py-0.5 text-[9px] text-blue-400">
                    <Clock className="h-2.5 w-2.5" />
                    {venue.currentEvent}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

