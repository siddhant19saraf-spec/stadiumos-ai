import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Total Spaces", value: "4,200" },
  { label: "Occupied", value: "3,156 (75%)" },
  { label: "Available", value: "1,044" },
  { label: "Accessible", value: "42 of 84 free" },
];

export default function ParkingPage() {
  return (
    <Shell title="Smart Parking">
      <ErrorBoundary module="Parking">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Smart Parking</h2>
            <p className="text-muted-foreground">Occupancy prediction, dynamic pricing, and valet routing.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardHeader><CardTitle className="text-sm font-medium">{s.label}</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
