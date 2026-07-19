import type { CrowdRecommendation, StadiumZone, CrowdAnalytics } from "../types";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IRecommendationEngine {
  generate(zones: StadiumZone[], analytics: CrowdAnalytics): CrowdRecommendation[];
}

export class MockRecommendationEngine implements IRecommendationEngine {
  generate(zones: StadiumZone[], analytics: CrowdAnalytics): CrowdRecommendation[] {
    const recommendations: CrowdRecommendation[] = [];
    const congested = zones.filter((z) => z.status === "congested" || z.status === "critical");
    const overloadedGates = zones.filter((z) => z.type === "gate" && z.densityPercent > 65);
    const underloadedGates = zones.filter((z) => z.type === "gate" && z.densityPercent < 35);

    if (congested.length > 0) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        action: "Activate Crowd Redistribution Protocol",
        location: congested.map((z) => z.name).join(", "),
        reason: `${congested.length} zone(s) at ${congested[0]!.status} density (${congested[0]!.densityPercent.toFixed(0)}%). Safety score dropping to ${congested[0]!.safetyScore.toFixed(0)}.`,
        priority: congested.some((z) => z.status === "critical") ? "critical" : "high",
        confidence: rand(85, 95),
        expectedImpact: "Reduces congestion by 35-45% within 15 minutes",
        implementationTime: "5 min",
        category: "entry",
      });
    }

    if (overloadedGates.length > 0 && underloadedGates.length > 0) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        action: "Redirect Entry Flow",
        location: `${overloadedGates[0]!.name} → ${underloadedGates[0]!.name}`,
        reason: `${overloadedGates[0]!.name} at ${overloadedGates[0]!.densityPercent.toFixed(0)}% while ${underloadedGates[0]!.name} at ${underloadedGates[0]!.densityPercent.toFixed(0)}%. Flow imbalance increasing wait times.`,
        priority: "medium",
        confidence: rand(82, 94),
        expectedImpact: "Balances gate utilization; reduces peak wait by 40%",
        implementationTime: "8 min",
        category: "entry",
      });
    }

    if (analytics.capacityPercent > 75) {
      recommendations.push({
        id: `rec-${Date.now()}-3`,
        action: "Deploy Additional Staff to High-Density Zones",
        location: zones.filter((z) => z.densityPercent > 60).map((z) => z.name).join(", "),
        reason: `Capacity at ${analytics.capacityPercent.toFixed(0)}% with ${analytics.visitorsPerMinute} visitors/min entering. Staff coverage needs reinforcement.`,
        priority: analytics.capacityPercent > 85 ? "critical" : "high",
        confidence: rand(80, 92),
        expectedImpact: "Improves response time by 50%; maintains safety standards",
        implementationTime: "10 min",
        category: "staff",
      });
    }

    if (recommendations.length < 3) {
      recommendations.push({
        id: `rec-${Date.now()}-4`,
        action: "Optimize Queue Capacity at Concessions",
        location: "Food Court A, Food Court B",
        reason: `Queue times averaging ${zones.filter((z) => z.type === "concession").reduce((s, z) => s + z.waitTimeMinutes, 0) / 2} min. Halftime surge expected.`,
        priority: "medium",
        confidence: rand(85, 93),
        expectedImpact: "Reduces wait time by 30%; increases throughput by 25%",
        implementationTime: "12 min",
        category: "staff",
      });
    }

    if (analytics.riskScore > 60) {
      recommendations.push({
        id: `rec-${Date.now()}-5`,
        action: "Issue Stadium-Wide Safety Communication",
        location: "All Zones",
        reason: `Risk score elevated at ${analytics.riskScore.toFixed(0)}/100. Proactive communication reduces incident probability.`,
        priority: "high",
        confidence: rand(75, 88),
        expectedImpact: "Reduces incident risk by 25%; improves crowd cooperation",
        implementationTime: "3 min",
        category: "communication",
      });
    }

    if (analytics.safetyIndex < 70) {
      recommendations.push({
        id: `rec-${Date.now()}-6`,
        action: "Emergency Infrastructure Activation",
        location: zones.filter((z) => z.safetyScore < 60).map((z) => z.name).join(", "),
        reason: `Safety index at ${analytics.safetyIndex.toFixed(0)}. Multiple zones below safety threshold.`,
        priority: "critical",
        confidence: rand(80, 90),
        expectedImpact: "Restores safety index above 80; prevents incident escalation",
        implementationTime: "15 min",
        category: "infrastructure",
      });
    }

    return recommendations.slice(0, 5);
  }
}

export const recommendationEngine = new MockRecommendationEngine();
