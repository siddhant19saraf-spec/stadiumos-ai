"use client";

import { Shell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/error-boundary";

export default function QueuePredictionPage() {
  return (
    <Shell title="Queue Analytics">
      <ErrorBoundary module="Queue">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Queue Analytics</h2>
            <p className="text-muted-foreground">Real-time wait-time prediction and dynamic lane management.</p>
          </div>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Queue Overview</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Loading queue data...</p></CardContent></Card>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
