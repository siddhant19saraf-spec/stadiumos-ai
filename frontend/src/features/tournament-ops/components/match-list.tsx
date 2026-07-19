"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import type { Match } from "../types";
import { MatchCard } from "./match-card";

interface MatchListProps {
  matches: Match[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

export function MatchList({ matches, selectedId, onSelect, className }: MatchListProps) {
  const sorted = useMemo(
    () => [...matches].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()),
    [matches],
  );
  const inProgress = sorted.filter((m) => m.status === "in_progress");
  const upcoming = sorted.filter((m) => m.status === "scheduled" || m.status === "preparing" || m.status === "team_arrival" || m.status === "warmup");
  const completed = sorted.filter((m) => m.status === "completed");

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          Match Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] space-y-4 overflow-y-auto">
        {inProgress.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Now
            </h4>
            <div className="space-y-2">
              {inProgress.map((m) => (
                <MatchCard key={m.id} match={m} isSelected={selectedId === m.id} onSelect={onSelect} />
              ))}
            </div>
          </div>
        )}
        <div>
          <h4 className="mb-2 text-[11px] font-medium text-blue-400">Upcoming ({upcoming.length})</h4>
          {upcoming.length === 0 && <p className="text-xs text-muted-foreground">No upcoming matches</p>}
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} isSelected={selectedId === m.id} onSelect={onSelect} />
            ))}
          </div>
        </div>
        {completed.length > 0 && (
          <div>
            <h4 className="mb-2 text-[11px] font-medium text-muted-foreground">Completed ({completed.length})</h4>
            <div className="space-y-2">
              {completed.slice(0, 3).map((m) => (
                <MatchCard key={m.id} match={m} isSelected={selectedId === m.id} onSelect={onSelect} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
