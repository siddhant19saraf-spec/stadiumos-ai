"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Timer, Users, Smile, Wifi, WifiOff, AlertCircle } from "lucide-react";
import type { QueuePointStatus, QueuePoint } from "../types";

interface QueueMonitorProps {
  points: QueuePoint[];
  statuses: Map<string, QueuePointStatus>;
  selectedQueueId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

const statusColors: Record<string, string> = {
  normal: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  busy: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  congested: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const typeLabels: Record<string, string> = {
  food_counter: "Food", beverage_counter: "Beverage", merchandise: "Merchandise",
  restroom: "Restroom", security: "Security", entry_gate: "Entry",
  customer_service: "Service", atm: "ATM", ticket_booth: "Tickets", information: "Info",
};

export function QueueMonitor({ points: _points, statuses, selectedQueueId, onSelect, className }: QueueMonitorProps) {
  const sorted = useMemo(() => {
    const arr = Array.from(statuses.values());
    const order: Record<string, number> = { critical: 0, congested: 1, busy: 2, normal: 3 };
    return arr.sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4));
  }, [statuses]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Live Queue Monitor</span>
          <Badge variant="outline" className="text-[10px]">{sorted.length} points</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 max-h-[450px] overflow-y-auto">
        {sorted.map((q) => {
          const breakdownCount = q.counterStatuses.filter((c) => c === "breakdown").length;
          return (
            <button
              key={q.queuePointId}
              className={cn(
                "w-full rounded-md border p-2.5 text-left transition-all hover:brightness-110",
                statusColors[q.status] ?? "border-muted bg-muted/20",
                selectedQueueId === q.queuePointId && "ring-1 ring-primary",
              )}
              onClick={() => onSelect(q.queuePointId)}
              tabIndex={0}
              aria-label={`${q.queuePointName}: ${q.estimatedWaitMin} min wait, ${q.currentLength} people`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  {breakdownCount > 0 && <AlertCircle className="h-3 w-3 text-red-400" />}
                  {q.queuePointName.length > 20 ? q.queuePointName.slice(0, 20) + "..." : q.queuePointName}
                </span>
                <span className="rounded bg-background/60 px-1.5 py-0.5 text-[8px] font-medium uppercase">
                  {typeLabels[q.type] ?? q.type}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[9px]">
                <div className="flex items-center gap-1"><Timer className="h-2.5 w-2.5" />{q.estimatedWaitMin} min</div>
                <div className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{q.currentLength}</div>
                <div className="flex items-center gap-1">
                  {breakdownCount > 0 ? <WifiOff className="h-2.5 w-2.5 text-red-400" /> : <Wifi className="h-2.5 w-2.5 text-emerald-400" />}
                  {q.activeCounters}/{q.totalCounters}
                </div>
                <div className="flex items-center gap-1"><Smile className="h-2.5 w-2.5" />{q.customerSatisfaction}</div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

