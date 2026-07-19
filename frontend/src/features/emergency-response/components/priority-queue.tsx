"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUp, Clock, MapPin, Brain } from "lucide-react";
import type { Incident } from "../types";

interface PriorityQueueProps {
  incidents: Incident[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

const priorityOrder: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
export const priorityLabel: Record<string, string> = { p0: "CRITICAL", p1: "HIGH", p2: "MEDIUM", p3: "LOW" };
const priorityColor: Record<string, string> = {
  p0: "bg-red-500/10 text-red-400 border-red-500/30",
  p1: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  p2: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  p3: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

export function PriorityQueue({ incidents, selectedId, onSelect, className }: PriorityQueueProps) {
  const sorted = useMemo(() =>
    [...incidents]
      .filter((i) => i.status !== "resolved")
      .sort((a, b) => {
        const p = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (p !== 0) return p;
        return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
      }),
    [incidents],
  );

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ArrowUp className="h-4 w-4 text-red-400" />
          Priority Queue
          <span className="ml-auto text-xs font-normal text-muted-foreground">{sorted.length} waiting</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] space-y-2 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">No incidents in queue</div>
        )}
        {sorted.map((inc, idx) => (
          <div
            key={inc.id}
            className="flex cursor-pointer items-center gap-3 rounded-md border bg-gradient-to-r from-primary/5 to-transparent px-3 py-2 transition-colors hover:bg-muted/20"
            onClick={() => onSelect?.(inc.id)}
            role="button"
            tabIndex={0}
            aria-selected={selectedId === inc.id}
            onKeyDown={(e) => e.key === "Enter" && onSelect?.(inc.id)}
          >
            <span className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold",
              priorityColor[inc.priority],
            )}>
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-card-foreground">{inc.title.length > 30 ? inc.title.slice(0, 30) + "..." : inc.title}</span>
                <Badge variant="outline" className={cn("text-[9px]", priorityColor[inc.priority])}>{priorityLabel[inc.priority]}</Badge>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{inc.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{Math.round((Date.now() - new Date(inc.reportedAt).getTime()) / 60000)}m</span>
                <span className="flex items-center gap-1"><Brain className="h-2.5 w-2.5" />{inc.aiConfidence}%</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

