"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Timer, Users, TrendingUp, Activity, Gauge, Smile, ShoppingBag, Zap } from "lucide-react";
import type { QueueIntelligenceState } from "../types";
import { queueEngine } from "../services/queue-engine";

interface CommandCenterProps {
  state: QueueIntelligenceState;
  className?: string;
}

export function CommandCenter({ state, className }: CommandCenterProps) {
  const stats = useMemo(() => {
    const arr = Array.from(state.queueStatuses.values());
    const totalQueues = arr.length;
    const avgWait = arr.length > 0 ? arr.reduce((s, q) => s + q.estimatedWaitMin, 0) / arr.length : 0;
    const longest = arr.length > 0 ? Math.max(...arr.map((q) => q.estimatedWaitMin)) : 0;
    const fastest = arr.length > 0 ? Math.min(...arr.map((q) => q.estimatedWaitMin)) : 0;
    const health = queueEngine.calculateHealth(state.queueStatuses);
    return { totalQueues, avgWait, longest, fastest, healthScore: health.healthScore, satisfactionAvg: health.satisfactionAvg, concessionScore: Math.round(health.healthScore * 0.85 + health.satisfactionAvg * 10) };
  }, [state.queueStatuses]);

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      <StatCard icon={Timer} label="Avg Wait Time" value={`${stats.avgWait.toFixed(0)} min`} subtitle="Across all queues" color={stats.avgWait > 15 ? "text-red-400" : stats.avgWait > 8 ? "text-amber-400" : "text-emerald-400"} />
      <StatCard icon={TrendingUp} label="Longest Queue" value={`${stats.longest} min`} subtitle="Current maximum" color={stats.longest > 20 ? "text-red-400" : "text-amber-400"} />
      <StatCard icon={Zap} label="Fastest Queue" value={`${stats.fastest} min`} subtitle="Current minimum" color="text-emerald-400" />
      <StatCard icon={Activity} label="Queue Health" value={`${stats.healthScore}`} subtitle="Score out of 100" color={stats.healthScore > 70 ? "text-emerald-400" : stats.healthScore > 45 ? "text-amber-400" : "text-red-400"} />
      <StatCard icon={Smile} label="Satisfaction" value={`${stats.satisfactionAvg}/5`} subtitle="Customer average" color={stats.satisfactionAvg >= 4 ? "text-emerald-400" : stats.satisfactionAvg >= 3 ? "text-amber-400" : "text-red-400"} />
      <StatCard icon={ShoppingBag} label="Concession Score" value={`${stats.concessionScore}`} subtitle="Performance index" color={stats.concessionScore > 70 ? "text-emerald-400" : stats.concessionScore > 45 ? "text-amber-400" : "text-red-400"} />
      <StatCard icon={Users} label="Active Queues" value={`${stats.totalQueues}`} subtitle="Total queue points" color="text-blue-400" />
      <StatCard icon={Gauge} label="Total Customers" value={state.analytics.totalCustomersServed.toLocaleString()} subtitle="Served this session" color="text-purple-400" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, color }: { icon: React.ElementType; label: string; value: string; subtitle: string; color: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-lg font-semibold", color)}>{value}</p>
      <p className="mt-0.5 text-[9px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}
