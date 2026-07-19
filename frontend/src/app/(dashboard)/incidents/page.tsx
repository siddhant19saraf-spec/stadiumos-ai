"use client";

import { Shell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/error-boundary";

export default function IncidentsPage() {
  return (
    <Shell title="Incident Analytics">
      <ErrorBoundary module="Incidents">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Incident Analytics</h2>
            <p className="text-muted-foreground">Root cause analysis, pattern detection, and post-event reports.</p>
          </div>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Incidents Overview</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Loading incident data...</p></CardContent></Card>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
