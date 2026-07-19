import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  { label: "Current Load", value: "342 MW", trend: "+12% vs yesterday" },
  { label: "Solar Generation", value: "87 MW", trend: "78% capacity" },
  { label: "Carbon Offset", value: "142 tCO₂", trend: "15% above target" },
  { label: "Battery Storage", value: "64%", trend: "Charging" },
];

export default function EnergyPage() {
  return (
    <Shell title="Stadium Energy & Sustainability">
      <ErrorBoundary module="Stadium Energy & Sustainability">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Stadium Energy & Sustainability</h2>
            <p className="text-muted-foreground">Stadium energy consumption monitoring, carbon footprint tracking, and AI-driven sustainability optimization.</p>
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
