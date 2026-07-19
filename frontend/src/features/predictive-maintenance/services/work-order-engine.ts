import type { WorkOrder, AssetHealth, MaintenanceAsset, WorkOrderPriority, WorkOrderStatus } from "../types";

let woCounter = 0;
function uid(): string {
  return `wo-${Date.now().toString(36)}-${++woCounter}`;
}

export interface IWorkOrderEngine {
  generate(healthMap: Map<string, AssetHealth>, assets: MaintenanceAsset[]): WorkOrder[];
  complete(woId: string, orders: WorkOrder[]): WorkOrder[];
  getByPriority(orders: WorkOrder[], priority: WorkOrderPriority): WorkOrder[];
}

export class MockWorkOrderEngine implements IWorkOrderEngine {
  generate(healthMap: Map<string, AssetHealth>, _assets: MaintenanceAsset[]): WorkOrder[] {
    const orders: WorkOrder[] = [];
    const now = new Date().toISOString();

    for (const [, h] of healthMap) {
      if (h.healthScore > 40) continue;
      const priority = this.determinePriority(h);

      orders.push({
        id: uid(),
        assetId: h.assetId,
        assetName: h.assetName,
        title: `${priority === "emergency" ? "EMERGENCY" : "Scheduled"}: ${h.assetName} maintenance`,
        description: `Health score: ${h.healthScore}. Risk score: ${h.riskScore}. Temperature: ${h.temperature}°C. ${h.remainingUsefulLife ? `RUL: ${h.remainingUsefulLife}.` : ""}`,
        priority,
        status: "open",
        requiredSkills: this.requiredSkills(h.type),
        estimatedRepairMin: this.estimateRepair(h.type, h.healthScore),
        requiredParts: this.requiredParts(h.type, h.healthScore),
        safetyInstructions: this.safetyInstructions(h.type),
        aiReasoning: `AI analysis indicates ${h.assetName} requires immediate attention. Health score ${h.healthScore} is below the ${priority} threshold of ${priority === "emergency" ? 20 : 40}. Risk score ${h.riskScore} suggests high probability of failure within ${h.remainingUsefulLife ?? "30 days"}.`,
        businessImpact: `Unplanned downtime of ${h.assetName} would affect ${this.affectedZone(h.type)}. Estimated revenue impact of $${(h.healthScore < 20 ? rand(5, 15) : rand(1, 5))}K per hour of downtime.`,
        createdAt: now,
        completedAt: null,
        assignedTeam: null,
      });
    }

    return orders.slice(0, 12);
  }

  complete(woId: string, orders: WorkOrder[]): WorkOrder[] {
    return orders.map((o) =>
      o.id === woId ? { ...o, status: "completed" as WorkOrderStatus, completedAt: new Date().toISOString() } : o,
    );
  }

  getByPriority(orders: WorkOrder[], priority: WorkOrderPriority): WorkOrder[] {
    return orders.filter((o) => o.priority === priority);
  }

  private determinePriority(h: AssetHealth): WorkOrderPriority {
    if (h.healthScore < 15) return "emergency";
    if (h.healthScore < 25) return "urgent";
    if (h.healthScore < 35) return "high";
    if (h.healthScore < 45) return "medium";
    return "low";
  }

  private requiredSkills(type: string): string[] {
    const skills: Record<string, string[]> = {
      hvac: ["HVAC Technician", "Refrigeration Specialist", "Electrician"],
      lighting: ["Electrical Engineer", "Lighting Technician"],
      power_distribution: ["Electrical Engineer", "Power Systems Specialist"],
      generator: ["Generator Technician", "Fuel Systems Specialist", "Electrician"],
      elevator: ["Elevator Mechanic", "Safety Inspector"],
      escalator: ["Escalator Technician", "Safety Inspector"],
      networking: ["Network Engineer", "Fiber Optic Technician"],
      cctv: ["Security Systems Technician", "Network Engineer"],
      water_pump: ["Plumber", "Pump Mechanic", "Pipefitter"],
      fire_safety: ["Fire Safety Engineer", "Electrician"],
      ev_charger: ["EV Charging Technician", "Electrician"],
      wifi: ["Network Engineer", "RF Engineer"],
    };
    return skills[type] ?? ["Maintenance Technician", "Equipment Specialist"];
  }

  private estimateRepair(type: string, health: number): number {
    const base: Record<string, number> = {
      hvac: 180, lighting: 90, scoreboard: 240, power_distribution: 300,
      generator: 240, elevator: 360, escalator: 300, networking: 60,
      cctv: 45, water_pump: 120, fire_safety: 120, ev_charger: 90,
      turnstile: 60, entry_gate: 90, parking_barrier: 45, wifi: 30,
    };
    const severityMultiplier = health < 20 ? 1.5 : 1.2;
    return Math.round((base[type] ?? 120) * severityMultiplier);
  }

  private requiredParts(type: string, health: number): string[] {
    const parts: Record<string, string[]> = {
      hvac: ["Air filter (H13)", "Fan belt", "Refrigerant R-410A"],
      generator: ["Oil filter", "Fuel filter", "Air filter", "Coolant"],
      lighting: health < 20 ? ["LED driver module", "Power supply unit"] : ["LED panel"],
      elevator: ["Door sensor", "Cable lubricant", "Brake pads"],
      power_distribution: ["MCB (63A)", "Contactor", "Busbar connector"],
    };
    return parts[type] ?? ["Diagnostic kit", "Cleaning supplies", "Lubricant"];
  }

  private safetyInstructions(type: string): string[] {
    const base = ["Lockout/Tagout (LOTO) procedure required", "Wear appropriate PPE (gloves, safety glasses)"];
    if (type === "power_distribution" || type === "generator") base.push("Verify power isolation with voltage tester");
    if (type === "elevator" || type === "escalator") base.push("Place safety barriers around work area");
    if (type === "fire_safety") base.push("Disable alarm zone during maintenance, notify control room");
    return base;
  }

  private affectedZone(type: string): string {
    const zones: Record<string, string> = {
      hvac: "spectator comfort in multiple stands",
      generator: "backup power for critical systems",
      power_distribution: "power supply to entire facility",
      networking: "all network-dependent systems",
      cctv: "security monitoring coverage",
      scoreboard: "match-day presentation and fan experience",
      elevator: "accessible vertical transport",
    };
    return zones[type] ?? "related operational area";
  }
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const workOrderEngine = new MockWorkOrderEngine();

