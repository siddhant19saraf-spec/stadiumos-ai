"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const statusStyles = { healthy: "bg-emerald-500/10 text-emerald-400", warning: "bg-amber-500/10 text-amber-400", critical: "bg-red-500/10 text-red-400" };

export function DomainView({ metrics, predictions }: {
  metrics: { label: string; value: string; sub: string; status: "healthy" | "warning" | "critical" }[];
  predictions: { type: string; assetName: string; probability: number; action: string; savings: number; carbon: number }[];
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-card-foreground">{m.label}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: m.status === "critical" ? "#f87171" : m.status === "warning" ? "#fbbf24" : undefined }}>{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px]", statusStyles[m.status])}>{m.status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {predictions.length > 0 && (
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">AI Predictions</h3>
            <div className="space-y-1.5">
              {predictions.map((p, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md bg-primary/5 px-2 py-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-card-foreground capitalize">{p.type}</span>
                      <span className="text-[10px] text-muted-foreground">— {p.assetName}</span>
                      <span className={cn("text-[10px] font-medium", p.probability >= 75 ? "text-red-400" : p.probability >= 50 ? "text-amber-400" : "text-emerald-400")}>
                        {p.probability}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{p.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
