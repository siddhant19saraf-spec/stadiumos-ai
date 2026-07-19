"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";
import type { Incident } from "../types";
import { IncidentCard } from "./incident-card";

interface IncidentFeedProps {
  incidents: Incident[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

export function IncidentFeed({ incidents, selectedId, onSelect, className }: IncidentFeedProps) {
  const sorted = useMemo(() =>
    [...incidents]
      .filter((i) => i.status !== "resolved")
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        const sev = order[a.severity] - order[b.severity];
        if (sev !== 0) return sev;
        return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
      }),
    [incidents],
  );

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <List className="h-4 w-4" />
          Live Incident Feed
          <span className="ml-auto text-xs font-normal text-muted-foreground">{sorted.length} active</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] space-y-2 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No active incidents
          </div>
        )}
        {sorted.map((inc) => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            isSelected={selectedId === inc.id}
            onSelect={onSelect}
          />
        ))}
      </CardContent>
    </Card>
  );
}
