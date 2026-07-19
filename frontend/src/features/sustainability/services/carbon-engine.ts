// @ts-nocheck
import type { CarbonMetrics, EnergyMetrics, WasteMetrics, WaterMetrics } from "../types";
import { CARBON_FACTORS } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

export interface ICarbonEngine {
  calculate(energyMetrics: EnergyMetrics[], wasteMetrics: WasteMetrics[], waterTotalL: number): CarbonMetrics;
  getScope1(energyMetrics: EnergyMetrics[]): number;
  getScope2(energyMetrics: EnergyMetrics[]): number;
  getScope3(): number;
  getNetZeroProgress(carbonMetrics: CarbonMetrics): number;
  getForecast(carbonMetrics: CarbonMetrics, months: number): { month: string; co2Kg: number; offsetKg: number; netKg: number }[];
}

export class MockCarbonEngine implements ICarbonEngine {
  calculate(energyMetrics: EnergyMetrics[], wasteMetrics: WasteMetrics[], waterTotalL: number): CarbonMetrics {
    const scope1 = this.getScope1(energyMetrics);
    const scope2 = this.getScope2(energyMetrics);
    const scope3 = this.getScope3();
    const totalCO2 = scope1 + scope2 + scope3;
    const totalEnergy = energyMetrics.reduce((s, m) => s + m.consumptionKw, 0);
    const co2PerKwh = totalEnergy > 0 ? totalCO2 / totalEnergy : 0;
    const renewable = energyMetrics.filter((m) => m.source === "solar").reduce((s, m) => s + m.consumptionKw, 0);
    const renewablePct = totalEnergy > 0 ? Math.round((renewable / totalEnergy) * 100) : 0;

    const wasteCO2 = wasteMetrics.reduce((s, m) => {
      const recyclableKg = m.totalKg * (m.recyclablePct / 100);
      const organicKg = m.totalKg * (m.organicPct / 100);
      const generalKg = m.totalKg - recyclableKg - organicKg;
      return s + (recyclableKg * CARBON_FACTORS.recyclingKgCO2PerKg) + (organicKg * CARBON_FACTORS.compostingKgCO2PerKg) + (generalKg * CARBON_FACTORS.wasteKgCO2PerKg);
    }, 0);
    const waterCO2 = waterTotalL * CARBON_FACTORS.waterKgCO2PerLiter;
    const carbonOffset = totalCO2 * (renewablePct / 100) * 0.5 + rf(50, 200);

    return {
      scope1: parseFloat(scope1.toFixed(1)),
      scope2: parseFloat(scope2.toFixed(1)),
      scope3: parseFloat((scope3 + wasteCO2 + waterCO2).toFixed(1)),
      totalCO2: parseFloat((totalCO2 + wasteCO2 + waterCO2).toFixed(1)),
      co2PerKwh: parseFloat(co2PerKwh.toFixed(4)),
      renewablePct,
      carbonOffset: parseFloat(carbonOffset.toFixed(1)),
      netCO2: parseFloat(Math.max(0, totalCO2 + wasteCO2 + waterCO2 - carbonOffset).toFixed(1)),
      timestamp: new Date().toISOString(),
    };
  }

  getScope1(energyMetrics: EnergyMetrics[]): number {
    return energyMetrics
      .filter((m) => m.source === "generator")
      .reduce((s, m) => s + m.consumptionKw * CARBON_FACTORS.generatorKgCO2PerKwh, 0);
  }

  getScope2(energyMetrics: EnergyMetrics[]): number {
    return energyMetrics
      .filter((m) => m.source === "grid")
      .reduce((s, m) => s + m.consumptionKw * CARBON_FACTORS.gridElectricityKgCO2PerKwh, 0);
  }

  getScope3(): number {
    return rf(50, 200);
  }

  getNetZeroProgress(carbonMetrics: CarbonMetrics): number {
    const baseline = 25000;
    const current = carbonMetrics.netCO2;
    return Math.min(100, Math.max(0, Math.round(((baseline - current) / baseline) * 100)));
  }

  getForecast(carbonMetrics: CarbonMetrics, months: number): { month: string; co2Kg: number; offsetKg: number; netKg: number }[] {
    const forecast: { month: string; co2Kg: number; offsetKg: number; netKg: number }[] = [];
    const now = new Date();
    let currentCO2 = carbonMetrics.totalCO2;

    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const reduction = i * rf(0.5, 2);
      const co2 = Math.max(0, currentCO2 * (1 - reduction / 100));
      const offset = co2 * (0.15 + i * 0.02);
      forecast.push({
        month,
        co2Kg: parseFloat(co2.toFixed(1)),
        offsetKg: parseFloat(offset.toFixed(1)),
        netKg: parseFloat(Math.max(0, co2 - offset).toFixed(1)),
      });
      currentCO2 = co2;
    }
    return forecast;
  }
}

export const carbonEngine = new MockCarbonEngine();

