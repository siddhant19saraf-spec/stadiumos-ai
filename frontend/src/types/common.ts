export type Severity = "low" | "medium" | "high" | "critical";
export type Status = "active" | "inactive" | "pending" | "archived";
export type AlertSeverity = "info" | "warning" | "critical";
export type EntityStatus = "online" | "offline" | "maintenance" | "error";
export type ModuleStatus = "connected" | "disconnected" | "error" | "loading";

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface MetricValue {
  label: string;
  value: number;
  unit: string;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  [key: string]: unknown;
}

import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { LucideProps } from "lucide-react";
export type IconType = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
