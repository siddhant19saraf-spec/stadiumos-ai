import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categories = [
  { label: "Security Incidents", count: "3", trend: "-40% MoM" },
  { label: "Safety Reports", count: "12", trend: "+2 vs last event" },
  { label: "Equipment Failures", count: "1", trend: "Lowest this quarter" },
  { label: "Customer Complaints", count: "8", trend: "Resolved within SLA" },
];

export default function IncidentsPage() {
  return (
    <Shell title="Incident Analytics">
      <ErrorBoundary module="Incidents">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Incident Analytics</h2>
            <p className="text-muted-foreground">Root cause analysis, pattern detection, and post-event reports.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <Card key={c.label}>
                <CardHeader><CardTitle className="text-sm font-medium">{c.label}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{c.count}</p>
                  <p className="text-xs text-muted-foreground">{c.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
