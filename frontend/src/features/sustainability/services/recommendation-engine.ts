// @ts-nocheck
import type { EnergyMetrics, WaterMetrics, WasteMetrics, AIRecommendation } from "../types";
import { UTILITY_RATES } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IRecommendationEngine {
  generate(energyMetrics: EnergyMetrics[], waterMetrics: WaterMetrics[], wasteMetrics: WasteMetrics[]): AIRecommendation[];
  getByPriority(recs: AIRecommendation[], priority: string): AIRecommendation[];
  getByCategory(recs: AIRecommendation[], category: string): AIRecommendation[];
}

export class MockRecommendationEngine implements IRecommendationEngine {
  generate(energyMetrics: EnergyMetrics[], waterMetrics: WaterMetrics[], wasteMetrics: WasteMetrics[]): AIRecommendation[] {
    const recs: AIRecommendation[] = [];

    for (const m of energyMetrics) {
      if (m.efficiency < 65) {
        const savings = Math.round(m.consumptionKw * 0.12 * 365 * 0.15);
        recs.push({
          id: `rec-${m.assetId}-${Date.now().toString(36)}`,
          title: `Reduce ${m.assetName} Output by 12%`,
          description: `AI analysis indicates ${m.assetName} operating at ${m.efficiency}% efficiency. Reducing output by 12% maintains service levels while saving energy.`,
          category: "energy",
          priority: m.efficiency < 50 ? "p0" : m.efficiency < 60 ? "p1" : "p2",
          status: "active",
          domain: "energy",
          assetId: m.assetId,
          assetName: m.assetName,
          estimatedSavingsKwh: Math.round(m.consumptionKw * 0.12 * 365),
          estimatedWaterSavingsL: 0,
          estimatedCostSavings: savings,
          estimatedCarbonReduction: Math.round(savings * 3.5),
          implementationCost: Math.round(savings * 0.3),
          roi: parseFloat((savings / Math.max(1, Math.round(savings * 0.3))).toFixed(1)),
          paybackDays: Math.round(0.3 * 365),
          reasoning: [
            `${m.assetName} efficiency at ${m.efficiency}% vs. target of 75%`,
            `Current consumption: ${m.consumptionKw}kW`,
            `12% reduction would save ${Math.round(m.consumptionKw * 0.12)}kW without impacting performance`,
          ],
          contributingFactors: [
            `Temperature: ${m.temperature}°C`,
            `Load factor: ${Math.round((m.consumptionKw / Math.max(1, m.peakDemandKw)) * 100)}%`,
          ],
          suggestedAction: `Implement automated load scheduling for ${m.assetName}. Reduce output during low-demand periods.`,
          automationPossible: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    for (const m of waterMetrics) {
      if (m.flowRateLmin > 20 && m.leakProbability > 15) {
        recs.push({
          id: `rec-${m.assetId}-${Date.now().toString(36)}`,
          title: `Repair Water Leak in ${m.assetName}`,
          description: `AI analysis detected ${m.leakProbability}% leak probability in ${m.assetName}. Estimated daily water loss: ${Math.round(m.flowRateLmin * 60 * 24 * 0.15)}L.`,
          category: "water",
          priority: m.leakProbability > 25 ? "p0" : "p1",
          status: "active",
          domain: "water",
          assetId: m.assetId,
          assetName: m.assetName,
          estimatedSavingsKwh: 0,
          estimatedWaterSavingsL: Math.round(m.flowRateLmin * 60 * 24 * 365 * 0.15),
          estimatedCostSavings: Math.round(m.flowRateLmin * 60 * 24 * 365 * 0.15 * UTILITY_RATES.waterCostPerLiter),
          estimatedCarbonReduction: Math.round(m.flowRateLmin * 60 * 24 * 365 * 0.15 * 0.0003),
          implementationCost: ri(200, 1000),
          roi: 5.0,
          paybackDays: ri(30, 90),
          reasoning: [
            `Leak probability: ${m.leakProbability}% — ${m.leakProbability > 20 ? "critical" : "elevated"}`,
            `Current flow rate: ${m.flowRateLmin} L/min`,
            `Pressure: ${m.pressureBar} bar — ${m.pressureBar > 5 ? "accelerating leak" : "normal"}`,
          ],
          contributingFactors: ["Pipe age and material", "Seasonal temperature variations", "Water pressure fluctuations"],
          suggestedAction: `Deploy acoustic leak detection sensors at ${m.assetName}. Schedule repair within 48 hours.`,
          automationPossible: false,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (recs.length < 5) {
      const defaultRecs = this.defaultRecommendations();
      recs.push(...defaultRecs.slice(0, 5 - recs.length));
    }

    return recs.sort((a, b) => {
      const priorityMap: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
      return (priorityMap[a.priority] ?? 99) - (priorityMap[b.priority] ?? 99);
    }).slice(0, 15);
  }

  getByPriority(recs: AIRecommendation[], priority: string): AIRecommendation[] {
    return recs.filter((r) => r.priority === priority);
  }

  getByCategory(recs: AIRecommendation[], category: string): AIRecommendation[] {
    return recs.filter((r) => r.category === category);
  }

  private defaultRecommendations(): AIRecommendation[] {
    return [
      {
        id: `rec-default-${Date.now().toString(36)}-1`, title: "Dim Lighting in East Stand Zone B",
        description: "East Stand Zone B lighting can be reduced by 30% during non-event periods without affecting safety compliance.",
        category: "energy", priority: "p2", status: "active", domain: "energy",
        assetId: "light-pitch", assetName: "Pitch Lighting Array",
        estimatedSavingsKwh: 15000, estimatedWaterSavingsL: 0, estimatedCostSavings: 1800,
        estimatedCarbonReduction: 750, implementationCost: 200, roi: 9.0, paybackDays: 40,
        reasoning: ["Zone B lighting currently at 85% intensity", "Safety audit confirms 55% adequate for non-event periods"],
        contributingFactors: ["Current schedule runs 6am-midnight", "LED fixtures support dimming"],
        suggestedAction: "Implement time-based dimming schedule. Reduce to 55% between 11pm-6am.",
        automationPossible: true, timestamp: new Date().toISOString(),
      },
      {
        id: `rec-default-${Date.now().toString(36)}-2`, title: "Shift EV Charging Load to Off-Peak Hours",
        description: "EV charging stations draw 350kW during peak hours. Shifting 60% of charging to off-peak reduces demand charges.",
        category: "energy", priority: "p1", status: "active", domain: "energy",
        assetId: "ev-bank1", assetName: "EV Charger Bank 1",
        estimatedSavingsKwh: 45000, estimatedWaterSavingsL: 0, estimatedCostSavings: 12000,
        estimatedCarbonReduction: 4500, implementationCost: 5000, roi: 2.4, paybackDays: 150,
        reasoning: ["Peak demand charges account for 35% of electricity bill", "Off-peak rates are 60% lower"],
        contributingFactors: ["Current: 70% of charging occurs 10am-6pm", "Battery storage available for load shifting"],
        suggestedAction: "Implement schedule-based charging. Offer 20% discount for off-peak charging.",
        automationPossible: true, timestamp: new Date().toISOString(),
      },
      {
        id: `rec-default-${Date.now().toString(36)}-3`, title: "Increase Solar Utilization During Peak Hours",
        description: "Solar arrays at 72% utilization. Increasing to 90% through inverter optimization and panel cleaning.",
        category: "energy", priority: "p2", status: "active", domain: "energy",
        assetId: "solar-roof", assetName: "Roof Solar Array",
        estimatedSavingsKwh: 28000, estimatedWaterSavingsL: 0, estimatedCostSavings: 3360,
        estimatedCarbonReduction: 12000, implementationCost: 2000, roi: 1.7, paybackDays: 210,
        reasoning: ["Current utilization: 72% of rated capacity", "Panel cleaning restores 8-12% efficiency"],
        contributingFactors: ["Dust accumulation reducing output", "Inverter firmware outdated"],
        suggestedAction: "Schedule panel cleaning. Update inverter firmware. Optimize angle for summer solstice.",
        automationPossible: false, timestamp: new Date().toISOString(),
      },
      {
        id: `rec-default-${Date.now().toString(36)}-4`, title: "Reschedule High-Energy Operations to Off-Peak",
        description: "Kitchen and cleaning operations currently running during peak rate periods. Shift 40% to off-peak.",
        category: "operations", priority: "p2", status: "active", domain: "energy",
        assetId: "kitch-main", assetName: "Main Kitchen",
        estimatedSavingsKwh: 32000, estimatedWaterSavingsL: 5000, estimatedCostSavings: 8400,
        estimatedCarbonReduction: 3200, implementationCost: 1000, roi: 8.4, paybackDays: 43,
        reasoning: ["Kitchen operates 10am-10pm daily", "Off-peak rates available 10pm-6am"],
        contributingFactors: ["Staff scheduling can accommodate shift", "Equipment can be pre-heated/pre-cooled"],
        suggestedAction: "Shift 40% of prep work to 6am-8am window. Use programmable start for ovens.",
        automationPossible: true, timestamp: new Date().toISOString(),
      },
      {
        id: `rec-default-${Date.now().toString(36)}-5`, title: "Optimize Backup Generator Testing Schedule",
        description: "Weekly generator tests consume 500L of diesel. Bi-weekly testing with load-bank optimization reduces fuel use.",
        category: "carbon", priority: "p3", status: "active", domain: "energy",
        assetId: "gen-a", assetName: "Backup Generator A",
        estimatedSavingsKwh: 8000, estimatedWaterSavingsL: 0, estimatedCostSavings: 5600,
        estimatedCarbonReduction: 6800, implementationCost: 0, roi: 0, paybackDays: 0,
        reasoning: ["Weekly test consumes 500L diesel at 85% load", "Regulatory minimum is bi-weekly"],
        contributingFactors: ["Dual generator setup provides redundancy", "Load-bank testing more efficient"],
        suggestedAction: "Transition to bi-weekly alternating tests. Implement load-bank optimization.",
        automationPossible: true, timestamp: new Date().toISOString(),
      },
    ];
  }
}

export const recommendationEngine = new MockRecommendationEngine();

