import type { TrendDataPoint, ESGKPI, SustainabilitySummary, EnergyMetrics, WaterMetrics, WasteMetrics, CarbonMetrics } from "../types";
import { SUSTAINABILITY_TARGETS } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

export interface IAnalyticsEngine {
  computeSummary(energy: EnergyMetrics[], water: WaterMetrics[], waste: WasteMetrics[], carbon: CarbonMetrics): SustainabilitySummary;
  computeTrends(): TrendDataPoint[];
  computeESGKpis(summary: SustainabilitySummary): ESGKPI[];
  computeCostSavings(energy: EnergyMetrics[]): number;
  computeCarbonReduction(energy: EnergyMetrics[]): number;
}

export class MockAnalyticsEngine implements IAnalyticsEngine {
  computeSummary(energy: EnergyMetrics[], water: WaterMetrics[], waste: WasteMetrics[], carbon: CarbonMetrics): SustainabilitySummary {
    const totalEnergy = energy.reduce((s, m) => s + m.consumptionKw, 0);
    const liveDemand = energy.reduce((s, m) => s + m.demandKw, 0);
    const totalWater = water.reduce((s, m) => s + m.totalConsumptionL, 0);
    const totalWaste = waste.reduce((s, m) => s + m.totalKg, 0);
    const avgEfficiency = energy.length > 0 ? energy.reduce((s, m) => s + m.efficiency, 0) / energy.length : 0;

    const renewable = energy.filter((m) => m.source === "solar").reduce((s, m) => s + m.consumptionKw, 0);
    const renewablePct = totalEnergy > 0 ? Math.round((renewable / totalEnergy) * 100) : 0;

    const sustainabilityScore = Math.min(100, Math.max(0, Math.round(
      (avgEfficiency * 0.25) + (carbon.renewablePct * 0.2) + (carbon.netCO2 < 10000 ? 90 : 60) * 0.2 +
      (SUSTAINABILITY_TARGETS.efficiencyMinTarget / 100) * 0.2 + (totalWaste < 500 ? 80 : 50) * 0.15
    )));

    const esgCompliance = Math.min(100, Math.max(0, Math.round(
      (carbon.renewablePct >= SUSTAINABILITY_TARGETS.renewablePctTarget ? 90 : 60) * 0.3 +
      (avgEfficiency >= SUSTAINABILITY_TARGETS.efficiencyMinTarget ? 85 : 55) * 0.3 +
      (totalWaste < 400 ? 80 : 50) * 0.2 +
      (totalWater < 50000 ? 80 : 50) * 0.2
    )));

    const netZeroProgress = carbonEngine.getNetZeroProgress(carbon);
    const costSavings = this.computeCostSavings(energy);
    const carbonReduction = this.computeCarbonReduction(energy);

    return {
      totalEnergyKwh: parseFloat(totalEnergy.toFixed(1)),
      livePowerDemandKw: parseFloat(liveDemand.toFixed(1)),
      totalWaterL: Math.round(totalWater),
      totalCO2Kg: parseFloat(carbon.totalCO2.toFixed(1)),
      wasteGeneratedKg: Math.round(totalWaste),
      renewablePct,
      operationalEfficiency: Math.round(avgEfficiency),
      sustainabilityScore,
      esgComplianceScore: esgCompliance,
      netZeroProgress,
      costSavingsYtd: costSavings,
      carbonReductionYtd: carbonReduction,
      lastUpdated: new Date().toISOString(),
    };
  }

  computeTrends(): TrendDataPoint[] {
    const trends: TrendDataPoint[] = [];
    const now = new Date();

    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split("T")[0]!;
      const seasonal = Math.sin(i * 0.07) * 0.2;
      trends.push({
        date,
        energyKwh: parseFloat((3500 + rf(-300, 300) + seasonal * 1000).toFixed(1)),
        waterL: Math.round(12000 + rf(-1000, 1000) + seasonal * 3000),
        wasteKg: Math.round(350 + rf(-30, 30) + seasonal * 100),
        co2Kg: parseFloat((1800 + rf(-150, 150) + seasonal * 400).toFixed(1)),
        renewablePct: Math.round(28 + rf(-3, 3) + i * 0.05),
        cost: parseFloat((420 + rf(-35, 35) + seasonal * 100).toFixed(1)),
        efficiency: Math.round(72 + rf(-4, 4) + i * 0.03),
      });
    }
    return trends;
  }

  computeESGKpis(summary: SustainabilitySummary): ESGKPI[] {
    return [
      { category: "energy", metric: "Renewable Energy %", value: summary.renewablePct, target: SUSTAINABILITY_TARGETS.renewablePctTarget, unit: "%", status: summary.renewablePct >= SUSTAINABILITY_TARGETS.renewablePctTarget ? "on_track" : summary.renewablePct >= SUSTAINABILITY_TARGETS.renewablePctTarget * 0.7 ? "at_risk" : "behind", trend: summary.renewablePct > 30 ? "improving" : "declining" },
      { category: "energy", metric: "Operational Efficiency", value: summary.operationalEfficiency, target: SUSTAINABILITY_TARGETS.efficiencyMinTarget, unit: "%", status: summary.operationalEfficiency >= SUSTAINABILITY_TARGETS.efficiencyMinTarget ? "on_track" : summary.operationalEfficiency >= SUSTAINABILITY_TARGETS.efficiencyMinTarget * 0.8 ? "at_risk" : "behind", trend: "stable" },
      { category: "carbon", metric: "Carbon Footprint", value: Math.round(summary.totalCO2Kg / 1000), target: 20, unit: "tCO2e", status: summary.totalCO2Kg < 20000 ? "on_track" : summary.totalCO2Kg < 25000 ? "at_risk" : "behind", trend: summary.totalCO2Kg > 22000 ? "declining" : "improving" },
      { category: "carbon", metric: "Net-Zero Progress", value: summary.netZeroProgress, target: SUSTAINABILITY_TARGETS.netZeroProgressTarget, unit: "%", status: summary.netZeroProgress >= 50 ? "on_track" : summary.netZeroProgress >= 30 ? "at_risk" : "behind", trend: "improving" },
      { category: "water", metric: "Water Consumption", value: Math.round(summary.totalWaterL / 1000), target: 50, unit: "kL", status: summary.totalWaterL < 50000 ? "on_track" : summary.totalWaterL < 65000 ? "at_risk" : "behind", trend: "stable" },
      { category: "waste", metric: "Waste Generated", value: summary.wasteGeneratedKg, target: 300, unit: "kg", status: summary.wasteGeneratedKg < 300 ? "on_track" : summary.wasteGeneratedKg < 450 ? "at_risk" : "behind", trend: summary.wasteGeneratedKg > 400 ? "declining" : "improving" },
      { category: "operations", metric: "Sustainability Score", value: summary.sustainabilityScore, target: SUSTAINABILITY_TARGETS.sustainabilityScoreTarget, unit: "%", status: summary.sustainabilityScore >= SUSTAINABILITY_TARGETS.sustainabilityScoreTarget ? "achieved" : summary.sustainabilityScore >= SUSTAINABILITY_TARGETS.sustainabilityScoreTarget * 0.7 ? "at_risk" : "behind", trend: "improving" },
      { category: "operations", metric: "ESG Compliance", value: summary.esgComplianceScore, target: SUSTAINABILITY_TARGETS.esgComplianceTarget, unit: "%", status: summary.esgComplianceScore >= SUSTAINABILITY_TARGETS.esgComplianceTarget ? "on_track" : summary.esgComplianceScore >= SUSTAINABILITY_TARGETS.esgComplianceTarget * 0.7 ? "at_risk" : "behind", trend: "improving" },
    ];
  }

  computeCostSavings(energy: EnergyMetrics[]): number {
    return Math.round(energy.reduce((s, m) => {
      const baseline = m.consumptionKw * 0.12 * 24 * 365;
      const optimized = baseline * 0.85;
      return s + (baseline - optimized);
    }, 0));
  }

  computeCarbonReduction(energy: EnergyMetrics[]): number {
    return Math.round(energy.reduce((s, m) => {
      const baseline = m.consumptionKw * 0.425 * 24 * 365;
      const optimized = baseline * 0.85;
      return s + (baseline - optimized);
    }, 0));
  }
}

const carbonEngine = { getNetZeroProgress: (c: CarbonMetrics) => Math.min(100, Math.max(0, Math.round(((25000 - c.netCO2) / 25000) * 100))) };

export const analyticsEngine = new MockAnalyticsEngine();

