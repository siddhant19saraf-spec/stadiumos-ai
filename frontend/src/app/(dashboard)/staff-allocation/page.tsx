"use client";

import { Shell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/error-boundary";

export default function StaffAllocationPage() {
  return (
    <Shell title="Staff Operations">
      <ErrorBoundary module="Staff">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Staff Operations</h2>
            <p className="text-muted-foreground">Shift optimization, skills-based matching, and fatigue monitoring.</p>
          </div>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Staff Overview</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Loading staff data...</p></CardContent></Card>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
