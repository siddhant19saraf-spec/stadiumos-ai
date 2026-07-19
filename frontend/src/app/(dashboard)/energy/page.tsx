"use client";

import { Shell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/error-boundary";

export default function EnergyPage() {
  return (
    <Shell title="Energy & Sustainability">
      <ErrorBoundary module="Energy">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Energy & Sustainability</h2>
            <p className="text-muted-foreground">Real-time consumption monitoring and carbon tracking.</p>
          </div>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Energy Overview</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Loading energy data...</p></CardContent></Card>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
