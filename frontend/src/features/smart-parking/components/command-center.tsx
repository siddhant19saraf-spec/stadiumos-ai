"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Car, CarFront, Star, Zap, Accessibility, ParkingCircle, Activity, Gauge } from "lucide-react";
import type { SmartParkingState } from "../types";

interface CommandCenterProps {
  state: SmartParkingState;
  className?: string;
}

export function CommandCenter({ state, className }: CommandCenterProps) {
  const totals = useMemo(() => {
    const arr = Array.from(state.slotStatuses.values());
    const totalSlots = arr.reduce((s, st) => s + st.totalSlots, 0);
    const totalOcc = arr.reduce((s, st) => s + st.occupied, 0);
    const totalAvail = arr.reduce((s, st) => s + st.available, 0);
    const totalReserved = arr.reduce((s, st) => s + st.reserved, 0);
    const vipStatus = state.slotStatuses.get("lot-vip");
    const evStatus = state.slotStatuses.get("lot-ev");
    const accessibleStatus = state.slotStatuses.get("lot-accessible");
    const overflowStatus = state.slotStatuses.get("lot-overflow");
    return { totalSlots, totalOcc, totalAvail, totalReserved, vipStatus, evStatus, accessibleStatus, overflowStatus };
  }, [state.slotStatuses]);

  const occPct = totals.totalSlots > 0 ? (totals.totalOcc / totals.totalSlots * 100) : 0;

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      <StatCard icon={CarFront} label="Total Capacity" value={totals.totalSlots.toLocaleString()} subtitle="All parking lots" color="text-blue-400" />
      <StatCard icon={Car} label="Available Spaces" value={totals.totalAvail.toLocaleString()} subtitle={`${occPct.toFixed(0)}% occupied`} color={totals.totalAvail < 500 ? "text-red-400" : totals.totalAvail < 1000 ? "text-amber-400" : "text-emerald-400"} />
      <StatCard icon={ParkingCircle} label="Occupied Spaces" value={totals.totalOcc.toLocaleString()} subtitle={getTrendLabel(totals.totalOcc, 0)} color={totals.totalOcc > 4000 ? "text-red-400" : "text-amber-400"} />
      <StatCard icon={Star} label="Reserved Spaces" value={totals.totalReserved.toLocaleString()} subtitle="VIP, media, staff" color="text-purple-400" />
      <StatCard icon={Star} label="VIP Parking" value={totals.vipStatus ? `${totals.vipStatus.occupancyPercent}%` : "N/A"} subtitle={`${totals.vipStatus?.available ?? "?"} spaces left`} color="text-amber-400" />
      <StatCard icon={Zap} label="EV Charging" value={totals.evStatus ? `${totals.evStatus.evChargingUsed}/${totals.evStatus.evChargingTotal}` : "N/A"} subtitle={`${totals.evStatus ? (totals.evStatus.evChargingUsed / totals.evStatus.evChargingTotal * 100).toFixed(0) : "?"}% in use`} color={totals.evStatus && totals.evStatus.evChargingUsed > totals.evStatus.evChargingTotal * 0.85 ? "text-red-400" : "text-cyan-400"} />
      <StatCard icon={Accessibility} label="Accessible Parking" value={totals.accessibleStatus ? `${totals.accessibleStatus.occupancyPercent}%` : "N/A"} subtitle={`${totals.accessibleStatus?.available ?? "?"} spaces`} color="text-emerald-400" />
      <StatCard icon={Activity} label="Overflow Status" value={totals.overflowStatus ? `${totals.overflowStatus.occupancyPercent}%` : "N/A"} subtitle={`${totals.overflowStatus?.available ?? "?"} remaining`} color={totals.overflowStatus && totals.overflowStatus.occupancyPercent > 50 ? "text-orange-400" : "text-muted-foreground"} />
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

function getTrendLabel(current: number, _previous: number): string {
  return current > 3500 ? "High demand" : current > 2000 ? "Moderate demand" : "Low demand";
}

