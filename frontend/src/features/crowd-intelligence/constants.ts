import type { StadiumZone, HeatmapConfig } from "./types";

export const STADIUM_ZONES: StadiumZone[] = [
  { id: "gate-a", name: "Gate A", type: "gate", capacity: 5000, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 25, y: 5, width: 10, height: 6 } },
  { id: "gate-b", name: "Gate B", type: "gate", capacity: 5000, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 45, y: 5, width: 10, height: 6 } },
  { id: "gate-c", name: "Gate C", type: "gate", capacity: 5000, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 65, y: 5, width: 10, height: 6 } },
  { id: "gate-d", name: "Gate D", type: "gate", capacity: 3000, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 85, y: 5, width: 10, height: 6 } },
  { id: "concourse-e", name: "East Concourse", type: "concourse", capacity: 8000, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 0, y: 15, width: 20, height: 25 } },
  { id: "concourse-w", name: "West Concourse", type: "concourse", capacity: 8000, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 80, y: 15, width: 20, height: 25 } },
  { id: "section-101", name: "Section 101", type: "section", capacity: 1500, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 22, y: 15, width: 14, height: 12 } },
  { id: "section-102", name: "Section 102", type: "section", capacity: 1500, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 38, y: 15, width: 14, height: 12 } },
  { id: "section-103", name: "Section 103", type: "section", capacity: 1500, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 54, y: 15, width: 14, height: 12 } },
  { id: "section-201", name: "Section 201", type: "section", capacity: 1200, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 22, y: 29, width: 14, height: 11 } },
  { id: "section-202", name: "Section 202", type: "section", capacity: 1200, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 38, y: 29, width: 14, height: 11 } },
  { id: "section-203", name: "Section 203", type: "section", capacity: 1200, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 54, y: 29, width: 14, height: 11 } },
  { id: "section-301", name: "Suite 301", type: "vip", capacity: 400, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 30, y: 41, width: 18, height: 8 } },
  { id: "section-302", name: "Suite 302", type: "vip", capacity: 400, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 52, y: 41, width: 18, height: 8 } },
  { id: "food-a", name: "Food Court A", type: "concession", capacity: 2000, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 5, y: 48, width: 18, height: 10 } },
  { id: "food-b", name: "Food Court B", type: "concession", capacity: 2000, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 77, y: 48, width: 18, height: 10 } },
  { id: "exit-n", name: "North Exit", type: "exit", capacity: 4000, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 38, y: 53, width: 24, height: 5 } },
  { id: "exit-s", name: "South Exit", type: "exit", capacity: 4000, currentCount: 0, densityPercent: 0, status: "normal", safetyScore: 100, waitTimeMinutes: 0, movementSpeed: 0, trend: "stable", location: { x: 38, y: 0, width: 24, height: 5 } },
];

export const HEATMAP_CONFIG: HeatmapConfig = {
  minOpacity: 0.15,
  maxOpacity: 0.85,
  colorStops: [
    { threshold: 0, color: "#22c55e" },
    { threshold: 40, color: "#eab308" },
    { threshold: 65, color: "#f97316" },
    { threshold: 85, color: "#ef4444" },
  ],
};

export const DENSITY_THRESHOLDS = {
  normal: { max: 40, color: "#22c55e", label: "Normal" },
  moderate: { max: 65, color: "#eab308", label: "Moderate" },
  congested: { max: 85, color: "#f97316", label: "Congested" },
  critical: { max: 100, color: "#ef4444", label: "Critical" },
} as const;

export const REFRESH_INTERVAL = 5000;
export const PREDICTION_HORIZON_MINUTES = 60;
