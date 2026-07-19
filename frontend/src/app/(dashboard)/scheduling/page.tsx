"use client";

import { Shell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/error-boundary";

export default function SchedulingPage() {
  return (
    <Shell title="Tournament Operations">
      <ErrorBoundary module="Scheduling">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tournament Operations</h2>
            <p className="text-muted-foreground">Schedule optimization, venue management, and conflict detection.</p>
          </div>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Schedule Overview</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Loading schedule data...</p></CardContent></Card>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
