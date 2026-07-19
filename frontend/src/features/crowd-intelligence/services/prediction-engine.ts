import type { CrowdPrediction, StadiumZone, CrowdAnalytics, AlertSeverity, PredictionType } from "../types";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export interface IPredictionEngine {
  analyze(zones: StadiumZone[], analytics: CrowdAnalytics): CrowdPrediction[];
}

const predictionTemplates: Array<{
  type: PredictionType;
  gen: (zone: StadiumZone, analytics: CrowdAnalytics) => CrowdPrediction;
}> = [
  {
    type: "crowd_movement",
    gen: (zone, _a) => {
      const sev: AlertSeverity = zone.densityPercent > 75 ? "high" : zone.densityPercent > 55 ? "medium" : "low";
      return {
        id: `pred-${Date.now()}-crowd`,
        type: "crowd_movement",
        title: `Crowd Movement Shift at ${zone.name}`,
        description: `Crowd flow analysis predicts movement toward ${zone.name} will ${zone.trend === "increasing" ? "increase" : "decrease"} by ${rand(15, 40)}% in the next 20 minutes.`,
        confidence: rand(78, 95),
        severity: sev,
        timeToOccur: `${rand(10, 25)} min`,
        affectedZone: zone.name,
        contributingFactors: [`Current density: ${zone.densityPercent.toFixed(0)}%`, `Event phase progression`, `Gate utilization patterns`, `Historical flow data at this time`],
        suggestedAction: zone.densityPercent > 65 ? "Open alternative pathways and deploy staff to manage flow" : "Continue monitoring standard flow patterns",
        businessImpact: zone.densityPercent > 65 ? "Prevents bottleneck formation; maintains movement speed above 0.8 m/s" : "No significant impact expected",
      };
    },
  },
  {
    type: "congestion",
    gen: (zone, _a) => ({
      id: `pred-${Date.now()}-cong`,
      type: "congestion",
      title: `Bottleneck Risk at ${zone.name}`,
      description: `${zone.name} approaching critical density. Current: ${zone.densityPercent.toFixed(0)}%. Predicted to reach ${Math.min(100, zone.densityPercent + rand(8, 18)).toFixed(0)}% within 15 minutes.`,
      confidence: rand(82, 96),
      severity: zone.densityPercent > 70 ? "high" : zone.densityPercent > 50 ? "medium" : "low",
      timeToOccur: `${rand(8, 20)} min`,
      affectedZone: zone.name,
      contributingFactors: [`Density increasing at ${zone.trend} rate`, `Limited exit capacity in this zone`, `Proximity to high-traffic areas`, `Current wait time: ${zone.waitTimeMinutes} min`],
      suggestedAction: zone.densityPercent > 65 ? "Activate crowd redistribution protocol. Open auxiliary exits and redirect flow to adjacent zones." : "Increase monitoring frequency for this zone",
      businessImpact: zone.densityPercent > 65 ? "Reduces congestion risk by 40%; maintains safety score above 75" : "Early detection prevents escalation",
    }),
  },
  {
    type: "queue_growth",
    gen: (zone, _a) => ({
      id: `pred-${Date.now()}-queue`,
      type: "queue_growth",
      title: `Queue Growth Alert: ${zone.name}`,
      description: `Queue at ${zone.name} expected to grow from ${zone.waitTimeMinutes}min to ${zone.waitTimeMinutes + rand(5, 15)}min during next phase change.`,
      confidence: rand(80, 93),
      severity: zone.waitTimeMinutes > 15 ? "high" : zone.waitTimeMinutes > 8 ? "medium" : "low",
      timeToOccur: `${rand(5, 15)} min`,
      affectedZone: zone.name,
      contributingFactors: [`Current wait time: ${zone.waitTimeMinutes} min`, `Phase transition expected in ${rand(10, 20)} min`, `Staff allocation at ${rand(60, 90)}% of recommended`],
      suggestedAction: zone.waitTimeMinutes > 10 ? "Activate additional service points and deploy 2-3 extra staff members" : "Prepare standby resources for next phase change",
      businessImpact: "Reduces average wait time by 35%; improves fan satisfaction by estimated 0.3 points",
    }),
  },
  {
    type: "gate_overload",
    gen: (zone, _a) => ({
      id: `pred-${Date.now()}-gate`,
      type: "gate_overload",
      title: `Gate Overload Risk: ${zone.name}`,
      description: `${zone.name} processing rate of ${rand(120, 200)} people/min may exceed safe throughput within ${rand(10, 25)} minutes.`,
      confidence: rand(75, 92),
      severity: "high",
      timeToOccur: `${rand(10, 25)} min`,
      affectedZone: zone.name,
      contributingFactors: [`Current throughput near maximum capacity`, `Secondary gates underutilized by ${rand(20, 50)}%`, `Event phase driving increased entry demand`],
      suggestedAction: "Redirect 25-30% of incoming traffic to underutilized gates. Deploy 2 additional screening stations.",
      businessImpact: "Balances gate utilization; reduces peak wait times by 45%",
    }),
  },
];

export class MockPredictionEngine implements IPredictionEngine {
  analyze(zones: StadiumZone[], _analytics: CrowdAnalytics): CrowdPrediction[] {
    const predictions: CrowdPrediction[] = [];
    const highDensityZones = zones
      .filter((z) => z.densityPercent > 50 && z.type !== "restroom")
      .sort((a, b) => b.densityPercent - a.densityPercent)
      .slice(0, 4);

    for (const zone of highDensityZones) {
      const template = pick(predictionTemplates);
      predictions.push(template.gen(zone, _analytics));
    }

    if (predictions.length === 0) {
      predictions.push({
        id: `pred-${Date.now()}-nominal`,
        type: "crowd_movement",
        title: "Nominal Operations Forecast",
        description: "All zones operating within normal parameters. No congestion predicted in the next 30 minutes.",
        confidence: rand(90, 98),
        severity: "low",
        timeToOccur: "30+ min",
        affectedZone: "Stadium-wide",
        contributingFactors: ["Balanced density distribution", "Adequate staff coverage", "Normal event phase progression", "Favorable weather conditions"],
        suggestedAction: "Continue standard monitoring. No intervention required.",
        businessImpact: "No impact. Operations continuing as planned.",
      });
    }

    return predictions;
  }
}

export const predictionEngine = new MockPredictionEngine();
