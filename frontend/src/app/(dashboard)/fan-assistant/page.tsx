"use client";

import { Shell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/error-boundary";

export default function FanAssistantPage() {
  return (
    <Shell title="Fan Experience">
      <ErrorBoundary module="Fan Assistant">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Fan Experience</h2>
            <p className="text-muted-foreground">AI-powered fan assistant, itineraries, and engagement.</p>
          </div>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Fan Assistant</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Loading fan assistant...</p></CardContent></Card>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
