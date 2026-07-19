import type { MaintenanceAsset, AssetHealth, AssetStatus, MaintenanceStatus } from "../types";
import { ASSETS, ALERT_THRESHOLDS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

export interface IAssetEngine {
  getAssets(): MaintenanceAsset[];
  simulateHealth(assets: MaintenanceAsset[]): Map<string, AssetHealth>;
  getAssetById(id: string): MaintenanceAsset | undefined;
}

export class MockAssetEngine implements IAssetEngine {
  private tick = 0;

  getAssets(): MaintenanceAsset[] {
    return ASSETS;
  }

  simulateHealth(assets: MaintenanceAsset[]): Map<string, AssetHealth> {
    this.tick++;
    const map = new Map<string, AssetHealth>();
    const now = new Date().toISOString();

    for (const asset of assets) {
      const baseHealth = this.baseHealth(asset.type);
      const ageDegradation = Math.sin(this.tick * 0.02 + parseInt(asset.id.slice(-3), 36)) * 5;
      const noise = randf(-4, 4);
      const health = this.clamp(baseHealth + ageDegradation + noise, 5, 100);
      const risk = this.clamp(100 - health + randf(-5, 5), 0, 95);
      const temp = this.baseTemp(asset.type) + (health < 40 ? randf(5, 15) : randf(-2, 3));
      const power = this.basePower(asset.type) * (1 + (1 - health / 100) * 0.3);
      const util = this.baseUtilization(asset.type) + randf(-5, 5);

      const status: AssetStatus = health >= ALERT_THRESHOLDS.HEALTH_WARNING ? "healthy" : health >= ALERT_THRESHOLDS.HEALTH_CRITICAL ? "warning" : health >= 15 ? "critical" : "offline";
      const maintStatus: MaintenanceStatus = this.pickMaintenance(health);

      map.set(asset.id, {
        assetId: asset.id,
        assetName: asset.name,
        type: asset.type,
        status,
        healthScore: Math.round(health),
        riskScore: Math.round(risk),
        temperature: parseFloat(temp.toFixed(1)),
        powerUsageKw: parseFloat(power.toFixed(1)),
        utilization: Math.round(this.clamp(util, 10, 100)),
        predictedFailureDate: health < 40 ? this.futureDate(rand(5, 45)) : health < 60 ? this.futureDate(rand(45, 120)) : null,
        remainingUsefulLife: health < 60 ? `${rand(30, 365)} days` : null,
        lastMaintenance: this.lastMaintDate(asset.installDate, health),
        maintenanceStatus: maintStatus,
        vibrationMmS: parseFloat((asset.type === "generator" || asset.type === "water_pump" ? randf(1, 9, 1) : randf(0.5, 4, 1)).toFixed(1)),
        pressureBar: parseFloat((asset.type === "water_pump" || asset.type === "fire_safety" ? randf(2, 10, 1) : randf(0.5, 3, 1)).toFixed(1)),
        lastUpdated: now,
      });
    }

    return map;
  }

  getAssetById(id: string): MaintenanceAsset | undefined {
    return ASSETS.find((a) => a.id === id);
  }

  private baseHealth(type: string): number {
    const bases: Record<string, number> = {
      hvac: 65, lighting: 75, scoreboard: 80, video_wall: 70, power_distribution: 60,
      generator: 55, elevator: 70, escalator: 65, fire_safety: 80, emergency_lighting: 75,
      water_pump: 55, plumbing: 70, networking: 80, wifi: 75, cctv: 70,
      turnstile: 75, entry_gate: 70, parking_barrier: 80, ev_charger: 65, pa_system: 75, digital_signage: 70,
    };
    return bases[type] ?? 70;
  }

  private baseTemp(type: string): number {
    const temps: Record<string, number> = {
      hvac: 38, power_distribution: 42, generator: 55, water_pump: 35,
      elevator: 30, networking: 45, wifi: 40, ev_charger: 35,
    };
    return temps[type] ?? 25;
  }

  private basePower(type: string): number {
    const power: Record<string, number> = {
      hvac: 45, lighting: 30, scoreboard: 15, video_wall: 8, power_distribution: 12,
      generator: 2, elevator: 10, escalator: 8, networking: 3, wifi: 1.5,
      cctv: 0.5, ev_charger: 50,
    };
    return (power[type] ?? 5);
  }

  private baseUtilization(type: string): number {
    const utils: Record<string, number> = {
      hvac: 70, lighting: 85, scoreboard: 40, power_distribution: 60,
      generator: 5, elevator: 50, escalator: 45, networking: 65, wifi: 70,
      cctv: 90, turnstile: 55, entry_gate: 50, ev_charger: 35, pa_system: 25,
    };
    return utils[type] ?? 50;
  }

  private pickMaintenance(health: number): MaintenanceStatus {
    if (health < 20) return "overdue";
    if (health < 35) return "in_progress";
    if (health < 50) return "scheduled";
    const r = Math.random();
    if (r < 0.05) return "overdue";
    if (r < 0.12) return "scheduled";
    if (r < 0.18) return "in_progress";
    return "none";
  }

  private futureDate(daysFromNow: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString();
  }

  private lastMaintDate(installDate: string, health: number): string {
    const install = new Date(installDate);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - install.getTime()) / 86400000);
    const lastMaintDays = Math.max(1, Math.floor(daysSince * (1 - health / 100)));
    const d = new Date();
    d.setDate(d.getDate() - lastMaintDays);
    return d.toISOString();
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }
}

export const assetEngine = new MockAssetEngine();
