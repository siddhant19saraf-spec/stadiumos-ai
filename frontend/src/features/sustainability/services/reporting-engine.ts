import type { ExecutiveReport, SustainabilitySummary, ESGKPI, AIRecommendation, TrendDataPoint } from "../types";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IReportingEngine {
  generate(summary: SustainabilitySummary, esgKpis: ESGKPI[], recommendations: AIRecommendation[], trends: TrendDataPoint[]): ExecutiveReport;
  getReportHistory(): { id: string; title: string; period: string; generatedAt: string }[];
}

export class MockReportingEngine implements IReportingEngine {
  generate(summary: SustainabilitySummary, esgKpis: ESGKPI[], recommendations: AIRecommendation[], _trends: TrendDataPoint[]): ExecutiveReport {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${lastMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })} - ${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;

    const energyKpis = [
      { metric: "Total Energy Consumption", value: summary.totalEnergyKwh, change: rf(-8, 5), unit: "kWh" },
      { metric: "Peak Power Demand", value: summary.livePowerDemandKw, change: rf(-10, 8), unit: "kW" },
      { metric: "Renewable Energy %", value: summary.renewablePct, change: rf(-2, 4), unit: "%" },
      { metric: "Energy Cost", value: Math.round(summary.totalEnergyKwh * 0.12), change: rf(-5, 5), unit: "$" },
      { metric: "Energy Efficiency", value: summary.operationalEfficiency, change: rf(-3, 3), unit: "%" },
    ];

    const waterKpis = [
      { metric: "Total Water Consumption", value: summary.totalWaterL, change: rf(-10, 8), unit: "L" },
      { metric: "Water Cost", value: Math.round(summary.totalWaterL * 0.002), change: rf(-8, 6), unit: "$" },
      { metric: "Leak Incidents", value: ri(0, 3), change: 0, unit: "count" },
      { metric: "Rainwater Harvested", value: Math.round(summary.totalWaterL * 0.15), change: rf(-20, 30), unit: "L" },
    ];

    const wasteKpis = [
      { metric: "Total Waste Generated", value: summary.wasteGeneratedKg, change: rf(-12, 8), unit: "kg" },
      { metric: "Recycling Rate", value: ri(35, 55), change: rf(-3, 5), unit: "%" },
      { metric: "Waste Diversion Rate", value: ri(40, 60), change: rf(-4, 6), unit: "%" },
      { metric: "Waste Disposal Cost", value: Math.round(summary.wasteGeneratedKg * 0.15), change: rf(-10, 5), unit: "$" },
    ];

    const carbonKpis = [
      { metric: "Total CO₂ Emissions", value: Math.round(summary.totalCO2Kg), change: rf(-10, 5), unit: "kg" },
      { metric: "CO₂ Intensity", value: parseFloat((summary.totalCO2Kg / Math.max(1, summary.totalEnergyKwh / 1000)).toFixed(1)), change: rf(-5, 3), unit: "kg/kWh" },
      { metric: "Carbon Offset", value: Math.round(summary.totalCO2Kg * 0.15), change: rf(-5, 8), unit: "kg" },
      { metric: "Net CO₂", value: Math.round(summary.totalCO2Kg * 0.85), change: rf(-10, 5), unit: "kg" },
      { metric: "Carbon Savings YTD", value: summary.carbonReductionYtd, change: rf(5, 15), unit: "kg" },
    ];

    return {
      id: `report-${Date.now().toString(36)}`,
      title: "Sustainability Executive Report",
      period,
      generatedAt: now.toISOString(),
      summary,
      energyKpis,
      waterKpis,
      wasteKpis,
      carbonKpis,
      esgScorecard: esgKpis,
      topRecommendations: recommendations.slice(0, 5),
      forecast: {
        nextMonthEnergy: Math.round(summary.totalEnergyKwh * (1 + rf(-0.05, 0.1))),
        nextMonthWater: Math.round(summary.totalWaterL * (1 + rf(-0.05, 0.08))),
        nextMonthWaste: Math.round(summary.wasteGeneratedKg * (1 + rf(-0.03, 0.12))),
        nextMonthCarbon: Math.round(summary.totalCO2Kg * (1 + rf(-0.08, 0.05))),
        netZeroProjectedDate: new Date(2033, ri(0, 11), 1).toISOString().split("T")[0]!,
      },
    };
  }

  getReportHistory(): { id: string; title: string; period: string; generatedAt: string }[] {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        id: `report-hist-${i}`,
        title: "Sustainability Executive Report",
        period: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        generatedAt: new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
      };
    });
  }
}

export const reportingEngine = new MockReportingEngine();

