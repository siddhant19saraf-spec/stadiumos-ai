"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Package, AlertTriangle, TrendingDown, RefreshCw, ShoppingCart, Clock } from "lucide-react";
import type { InventoryItem } from "../types";

interface InventoryPanelProps {
  inventory: Map<string, InventoryItem>;
  className?: string;
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/20 text-red-400",
  high: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  medium: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  low: "bg-blue-500/10 border-blue-500/20 text-blue-400",
};

export function InventoryPanel({ inventory, className }: InventoryPanelProps) {
  const items = useMemo(() => {
    const arr = Array.from(inventory.values());
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return arr.sort((a, b) => (order[a.restockPriority] ?? 4) - (order[b.restockPriority] ?? 4));
  }, [inventory]);

  const stats = useMemo(() => {
    const arr = Array.from(inventory.values());
    return {
      total: arr.length,
      critical: arr.filter((i) => i.restockPriority === "critical").length,
      high: arr.filter((i) => i.restockPriority === "high").length,
      avgWaste: arr.length > 0 ? arr.reduce((s, i) => s + i.wastePercent, 0) / arr.length : 0,
      avgStock: arr.length > 0 ? arr.reduce((s, i) => s + (i.currentStock / i.maxStock) * 100, 0) / arr.length : 0,
    };
  }, [inventory]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Predictive Inventory</span>
          <Badge variant="outline" className={cn("text-[10px]", stats.critical > 0 ? "bg-red-500/10 text-red-400" : "")}>
            {stats.critical} critical
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MiniStat icon={Package} label="Total Items" value={stats.total.toString()} />
          <MiniStat icon={AlertTriangle} label="Needs Restock" value={(stats.critical + stats.high).toString()} color={stats.critical > 0 ? "text-red-400" : "text-muted-foreground"} />
          <MiniStat icon={TrendingDown} label="Avg Waste" value={`${stats.avgWaste.toFixed(1)}%`} />
          <MiniStat icon={RefreshCw} label="Avg Stock" value={`${stats.avgStock.toFixed(0)}%`} color={stats.avgStock < 40 ? "text-red-400" : stats.avgStock < 60 ? "text-amber-400" : "text-emerald-400"} />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">Inventory Status</p>
          {items.slice(0, 8).map((item) => {
            const stockPct = (item.currentStock / item.maxStock) * 100;
            return (
              <div key={item.id} className={cn("rounded-md border p-2", priorityColors[item.restockPriority] ?? "border-muted bg-muted/20")}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-medium">
                    <ShoppingCart className="h-2.5 w-2.5" />
                    {item.name}
                  </span>
                  <Badge variant="outline" className="text-[7px]">{item.category}</Badge>
                </div>
                <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, stockPct)}%`, backgroundColor: stockPct < 20 ? "#ef4444" : stockPct < 40 ? "#f97316" : stockPct < 60 ? "#eab308" : "#22c55e" }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  <span>{item.currentStock}/{item.maxStock}</span>
                  <span>Demand: {item.dailyDemand}/day</span>
                  {item.predictedShortageInMin !== null && (
                    <span className="text-red-400">
                      <Clock className="mr-0.5 inline h-2 w-2" />
                      {item.predictedShortageInMin} min
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/20 px-2.5 py-1.5">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-[9px] text-muted-foreground">{label}</p>
        <p className={cn("text-xs font-medium text-card-foreground", color)}>{value}</p>
      </div>
    </div>
  );
}
