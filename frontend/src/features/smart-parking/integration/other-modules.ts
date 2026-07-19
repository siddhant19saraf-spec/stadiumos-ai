/**
 * Integration adapter for cross-module communication.
 *
 * Smart Parking & Traffic Intelligence interfaces with:
 * - AI Copilot: provides parking/traffic status for voice/text queries
 * - Digital Twin: renders parking occupancy on stadium map
 * - Emergency Center: shares incident data affecting traffic
 * - Crowd Intelligence: shares parking demand patterns
 * - Tournament Operations: provides parking capacity for event planning
 *
 * Each method returns data shaped for the consuming module.
 * In production, these would be real API calls or event bus messages.
 */

import { smartParkingService } from "../services/smart-parking-service";

export interface CopilotParkingSummary {
  totalLots: number;
  totalCapacity: number;
  totalOccupied: number;
  availableSpaces: number;
  trafficHealthScore: number;
  activeAlerts: number;
  criticalAlerts: number;
  estimatedWaitMin: number;
  overflowActive: boolean;
  lastUpdated: string;
}

export interface DigitalTwinParkingOverlay {
  lotId: string;
  lotName: string;
  occupancyPercent: number;
  type: string;
  available: number;
  coordinateCenter: { x: number; y: number };
  color: string;
}

export interface EmergencyTrafficImpact {
  affectedRoads: string[];
  blockedRoads: string[];
  estimatedClearTime: string | null;
  rerouteSuggestions: string[];
  severity: string;
}

export interface TournamentParkingCapacity {
  eventId: string;
  totalCapacity: number;
  reservedCapacity: number;
  availableForEvent: number;
  confidence: number;
  peakTime: string;
}

export class SmartParkingIntegration {
  static getCopilotSummary(): CopilotParkingSummary {
    const state = smartParkingService.getState();
    const totalCap = Array.from(state.slotStatuses.values()).reduce((s, st) => s + st.totalSlots, 0);
    const totalOcc = Array.from(state.slotStatuses.values()).reduce((s, st) => s + st.occupied, 0);
    return {
      totalLots: state.lots.length,
      totalCapacity: totalCap,
      totalOccupied: totalOcc,
      availableSpaces: totalCap - totalOcc,
      trafficHealthScore: state.traffic.trafficHealthScore,
      activeAlerts: state.alerts.filter((a) => !a.acknowledged).length,
      criticalAlerts: state.alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length,
      estimatedWaitMin: state.analytics.trafficDelayMin,
      overflowActive: (state.slotStatuses.get("lot-overflow")?.occupancyPercent ?? 0) > 30,
      lastUpdated: state.lastUpdated,
    };
  }

  static getDigitalTwinOverlay(): DigitalTwinParkingOverlay[] {
    const state = smartParkingService.getState();
    return state.lots.map((lot) => {
      const s = state.slotStatuses.get(lot.id);
      return {
        lotId: lot.id,
        lotName: lot.name,
        occupancyPercent: s?.occupancyPercent ?? 0,
        type: lot.type,
        available: s?.available ?? 0,
        coordinateCenter: {
          x: lot.coordinates.x + lot.coordinates.width / 2,
          y: lot.coordinates.y + lot.coordinates.height / 2,
        },
        color: s && s.occupancyPercent > 85 ? "#ef4444" : s && s.occupancyPercent > 65 ? "#f97316" : "#22c55e",
      };
    });
  }

  static getEmergencyImpact(): EmergencyTrafficImpact {
    const state = smartParkingService.getState();
    const blocked = state.roads.filter((r) => r.status === "closed");
    const congested = state.roads.filter((r) => r.congestionLevel === "severe" || r.congestionLevel === "high");
    return {
      affectedRoads: congested.map((r) => r.name),
      blockedRoads: blocked.map((r) => r.name),
      estimatedClearTime: congested.length > 0 ? "30-60 min" : null,
      rerouteSuggestions: blocked.length > 0
        ? ["Use North/South entry roads", "Consider overflow parking access"]
        : [],
      severity: state.traffic.trafficHealthScore < 40 ? "high" : state.traffic.trafficHealthScore < 60 ? "medium" : "low",
    };
  }

  static getTournamentCapacity(eventId: string): TournamentParkingCapacity {
    const state = smartParkingService.getState();
    const generalLots = state.lots.filter((l) => l.type === "general" || l.type === "overflow");
    const totalCap = generalLots.reduce((s, l) => s + l.capacity, 0);
    const reserved = Array.from(state.slotStatuses.values()).reduce((s, st) => s + st.reserved, 0);
    const avgConfidence = state.predictions.reduce((s, p) => s + p.confidence, 0) / Math.max(1, state.predictions.length);

    return {
      eventId,
      totalCapacity: totalCap,
      reservedCapacity: reserved,
      availableForEvent: totalCap - reserved,
      confidence: Math.round(avgConfidence),
      peakTime: state.analytics.peakTime,
    };
  }
}
