import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const teams = [
  { role: "Security", assigned: 48, needed: 52, gap: 4 },
  { role: "Concessions", assigned: 120, needed: 120, gap: 0 },
  { role: "Clean-up", assigned: 35, needed: 40, gap: 5 },
  { role: "First Aid", assigned: 12, needed: 12, gap: 0 },
  { role: "Guest Services", assigned: 28, needed: 30, gap: 2 },
];

export default function StaffAllocationPage() {
  return (
    <Shell title="Staff Operations">
      <ErrorBoundary module="Staff">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Staff Operations</h2>
            <p className="text-muted-foreground">Shift optimization, skills-based matching, and fatigue monitoring.</p>
          </div>
          <Card>
            <CardHeader><CardTitle>Staffing Gaps</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teams.map((t) => (
                  <div key={t.role} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{t.role}</p>
                      <p className="text-sm text-muted-foreground">{t.assigned} / {t.needed} assigned</p>
                    </div>
                    {t.gap > 0 ? (
                      <span className="text-sm text-amber-500 font-medium">{t.gap} open</span>
                    ) : (
                      <span className="text-sm text-emerald-500 font-medium">Fully staffed</span>
                    )}
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
