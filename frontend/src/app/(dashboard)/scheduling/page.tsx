import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const slots = [
  { time: "10:00 AM", event: "Opening Ceremony", venue: "Main Stadium", status: "Completed" },
  { time: "2:30 PM", event: "Semi-Final 1", venue: "Main Stadium", status: "In Progress" },
  { time: "6:00 PM", event: "Concert", venue: "East Pavilion", status: "Upcoming" },
  { time: "9:00 PM", event: "Awards Night", venue: "Grand Hall", status: "Upcoming" },
];

export default function SchedulingPage() {
  return (
    <Shell title="Tournament & Match Operations">
      <ErrorBoundary module="Tournament & Match Operations">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tournament & Match Operations</h2>
            <p className="text-muted-foreground">Tournament scheduling, multi-venue match coordination, fixture conflict detection, and game-day timeline management.</p>
          </div>
          <Card>
            <CardHeader><CardTitle>Today's Schedule</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {slots.map((s) => (
                  <div key={s.time} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{s.time}</p>
                      <p className="text-sm text-muted-foreground">{s.event} &middot; {s.venue}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{s.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
