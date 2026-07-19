"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play, Square, FastForward, Rewind, Clock } from "lucide-react";
import type { TimeTravelState, TimelineSnapshot } from "../types";

interface TimeTravelControlsProps {
  timeTravel: TimeTravelState;
  snapshots: TimelineSnapshot[];
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

export function TimeTravelControls({ timeTravel, snapshots, onStart, onStop, className }: TimeTravelControlsProps) {
  const hasSnapshots = snapshots.length > 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Time Travel</span>
          {timeTravel.active && (
            <Badge variant="outline" className="bg-blue-500/10 text-[10px] text-blue-400">PLAYING</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasSnapshots ? (
          <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
            Collecting timeline data...
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                disabled={!timeTravel.active}
                aria-label="Rewind"
              >
                <Rewind className="h-3 w-3" />
              </Button>
              <Button
                variant={timeTravel.active ? "secondary" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={timeTravel.active ? onStop : onStart}
                aria-label={timeTravel.active ? "Pause" : "Play timeline"}
              >
                {timeTravel.active ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                disabled={!timeTravel.active}
                aria-label="Fast forward"
              >
                <FastForward className="h-3 w-3" />
              </Button>
            </div>

            <div className="relative">
              <input
                type="range"
                min={0}
                max={snapshots.length - 1}
                value={snapshots.length - 1}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                aria-label="Timeline scrubber"
              />
              <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground">
                <span>{new Date(timeTravel.availableRange.start).toLocaleTimeString()}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {snapshots.length} snapshots
                </span>
                <span>{new Date(timeTravel.availableRange.end).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {snapshots.slice(-5).reverse().map((s, i) => (
                <button
                  key={s.timestamp}
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[8px] transition-colors",
                    i === 0
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-muted text-muted-foreground hover:border-muted-foreground/30",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
