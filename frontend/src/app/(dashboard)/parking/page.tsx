"use client";

import { Shell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/error-boundary";

export default function ParkingPage() {
  return (
    <Shell title="Smart Parking">
      <ErrorBoundary module="Parking">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Smart Parking</h2>
            <p className="text-muted-foreground">Occupancy prediction, dynamic pricing, and valet routing.</p>
          </div>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Parking Overview</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Loading parking data...</p></CardContent></Card>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
