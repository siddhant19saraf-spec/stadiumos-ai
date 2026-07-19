import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { title: "AI Itinerary Planner", desc: "Personalized match-day schedules based on preferences" },
  { title: "Smart Notifications", desc: "Real-time gate changes, delay alerts, and offers" },
  { title: "Concession Pre-orders", desc: "Order food and merchandise for pickup" },
  { title: "Navigation Assistant", desc: "Turn-by-turn directions within the venue" },
];

export default function FanAssistantPage() {
  return (
    <Shell title="Fan Experience & Engagement">
      <ErrorBoundary module="Fan Experience & Engagement">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Fan Experience & Engagement</h2>
            <p className="text-muted-foreground">AI-powered fan assistant, personalized match-day itineraries, and stadium engagement.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader><CardTitle>{f.title}</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{f.desc}</p></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    </Shell>
  );
}
