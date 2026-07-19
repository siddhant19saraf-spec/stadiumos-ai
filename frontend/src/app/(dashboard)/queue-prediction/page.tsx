import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  { label: "Avg Wait Time", value: "4m 32s", trend: "-18% from peak" },
  { label: "Max Queue Depth", value: "47 people", trend: "Gate C, 2:15 PM" },
  { label: "Lanes Open", value: "12 of 16", trend: "4 closed for cleaning" },
  { label: "Prediction Accuracy", value: "94.2%", trend: "+2.1% this week" },
];

export default function QueuePredictionPage() {
  return (
    <Shell title="Queue Analytics">
      <ErrorBoundary module="Queue">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Queue Analytics</h2>
            <p className="text-muted-foreground">Real-time wait-time prediction and dynamic lane management.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <Card key={m.label}>
                <CardHeader><CardTitle className="text-sm font-medium">{m.label}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
