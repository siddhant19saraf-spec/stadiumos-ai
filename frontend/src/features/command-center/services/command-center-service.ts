import type {
  CommandCenterData,
  AIExecutiveSummary,
  AIRecommendation,
  ActivityEvent,
  Incident,
  KPIMetric,
  ChartDataPoint,
  AIProviderStatus,
} from "../types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateKPITrend(length: number, base: number, variance: number): number[] {
  return Array.from({ length }, (_, i) =>
    Math.max(0, base + Math.sin(i * 0.5) * variance + randomInt(-variance / 2, variance / 2)),
  );
}

const teamNames = [
  "FC Barcelona", "Real Madrid", "Manchester City", "Bayern Munich",
  "Paris Saint-Germain", "Juventus", "Liverpool FC", "AC Milan",
  "Inter Milan", "Chelsea FC", "Arsenal FC", "Borussia Dortmund",
];

const incidentTypes = [
  "Security breach", "Medical emergency", "Fire alarm", "Structural issue",
  "Power outage", "Crowd congestion", "Unauthorized access", "Equipment failure",
];

const locations = [
  "Gate A", "Gate B", "Gate C", "Gate D", "Gate E",
  "Section 101", "Section 204", "Section 312", "Section 415",
  "Food Court A", "Food Court B", "Food Court C",
  "Parking Lot A", "Parking Lot B", "Parking Lot C",
  "East Concourse", "West Concourse", "North Concourse",
  "VIP Lounge", "Press Box", "Broadcast Center",
  "Medical Station 1", "Medical Station 2", "Security Command",
];

const teams = [
  "Security Unit Alpha", "Security Unit Bravo", "Medical Response A",
  "Medical Response B", "Fire Safety Team", "Technical Support",
  "Crowd Management", "Parking Operations", "Facility Maintenance",
];

const activityVerbs = [
  "deployed to", "dispatched to", "activated at", "responded to",
  "arrived at", "cleared from", "secured", "resolved at",
];

function generateSummary(data: Partial<CommandCenterData>): AIExecutiveSummary {
  const highlights = [];
  const parts: string[] = [];

  const cap = data.hero?.capacityPercent ?? 0;
  if (cap < 60) {
    parts.push("Overall stadium operations are healthy.");
    highlights.push({ type: "positive" as const, message: "All systems operating within normal parameters" });
  } else if (cap < 85) {
    parts.push("Stadium operations are stable with moderate activity.");
    highlights.push({ type: "info" as const, message: "Crowd levels are building as expected" });
  } else {
    parts.push("Stadium is operating at high capacity. Monitoring closely.");
    highlights.push({ type: "warning" as const, message: "High capacity utilization requires attention" });
  }

  const crowdDensity = data.kpis?.find((k) => k.id === "crowd-density")?.value ?? 45;
  if (crowdDensity > 75) {
    parts.push(`Crowd density near East Gate is increasing at ${crowdDensity}%.`);
    highlights.push({ type: "warning" as const, message: "East Gate crowd density above threshold" });
  }

  const queueTime = data.kpis?.find((k) => k.id === "avg-queue-time")?.value ?? 5;
  if (queueTime > 10) {
    parts.push(`Food Court B is expected to reach a ${queueTime}-minute queue within 15 minutes.`);
    highlights.push({ type: "warning" as const, message: "Food Court B queue predicted to exceed 15 minutes" });
  }

  const parkingUsage = data.kpis?.find((k) => k.id === "parking-usage")?.value ?? 50;
  if (parkingUsage > 90) {
    parts.push("Parking Lot C will reach full capacity soon.");
    highlights.push({ type: "critical" as const, message: "Parking Lot C approaching full capacity" });
  } else if (parkingUsage > 70) {
    parts.push(`Parking occupancy is at ${parkingUsage}%.`);
  }

  const alerts = data.kpis?.find((k) => k.id === "emergency-alerts")?.value ?? 0;
  if (alerts === 0) {
    parts.push("No critical emergencies detected.");
    highlights.push({ type: "positive" as const, message: "Zero active critical incidents" });
  } else {
    parts.push(`${alerts} active incident${alerts > 1 ? "s" : ""} requiring attention.`);
    highlights.push({ type: "critical" as const, message: `${alerts} active incident${alerts > 1 ? "s" : ""} in progress` });
  }

  const revenue = data.kpis?.find((k) => k.id === "revenue")?.value ?? 0;
  if (revenue > 0) {
    parts.push(`Current revenue stands at $${revenue.toLocaleString()}.`);
  }

  return {
    summary: parts.join(" "),
    highlights,
    generatedAt: new Date().toISOString(),
  };
}

export const commandCenterService = {
  async getData(): Promise<CommandCenterData> {
    const match: CommandCenterData["match"] = {
      homeTeam: teamNames[randomInt(0, teamNames.length - 1)],
      awayTeam: teamNames[randomInt(0, teamNames.length - 1)],
      homeScore: randomInt(0, 4),
      awayScore: randomInt(0, 4),
      minute: randomInt(5, 90),
      status: "second_half",
      startTime: new Date(Date.now() - randomInt(30, 90) * 60000).toISOString(),
    };

    const attendance = randomInt(25000, 72000);
    const capacity = 75000;
    const capacityPercent = parseFloat(((attendance / capacity) * 100).toFixed(1));
    const crowdDensity = randomFloat(30, 95);
    const parkingUsage = randomFloat(45, 98);
    const queueTime = randomFloat(3, 25);
    const emergencyAlerts = Math.random() > 0.7 ? randomInt(1, 3) : 0;
    const staffAvailability = randomFloat(65, 100);
    const energyConsumption = randomFloat(250, 850);
    const revenue = randomInt(150000, 2500000);
    const fanSatisfaction = randomFloat(3.2, 4.9);

    const totalVisitors = attendance + randomInt(2000, 8000);

    const kpis: KPIMetric[] = [
      {
        id: "total-visitors",
        label: "Total Visitors",
        value: totalVisitors,
        unit: "people",
        change: randomFloat(-5, 12),
        changeType: "increase",
        icon: "Users",
        trend: generateKPITrend(24, attendance / 24, 200),
      },
      {
        id: "crowd-density",
        label: "Crowd Density",
        value: crowdDensity,
        unit: "%",
        change: randomFloat(-8, 8),
        changeType: crowdDensity > 70 ? "increase" : "decrease",
        icon: "Activity",
        trend: generateKPITrend(24, crowdDensity, 5),
      },
      {
        id: "emergency-alerts",
        label: "Emergency Alerts",
        value: emergencyAlerts,
        unit: "active",
        change: emergencyAlerts > 0 ? randomFloat(0, 2) : 0,
        changeType: emergencyAlerts > 0 ? "increase" : "neutral",
        icon: "AlertTriangle",
        trend: [],
      },
      {
        id: "parking-usage",
        label: "Parking Usage",
        value: parkingUsage,
        unit: "%",
        change: randomFloat(-10, 10),
        changeType: parkingUsage > 80 ? "increase" : "decrease",
        icon: "Car",
        trend: generateKPITrend(24, parkingUsage, 8),
      },
      {
        id: "avg-queue-time",
        label: "Avg Queue Time",
        value: queueTime,
        unit: "min",
        change: randomFloat(-5, 5),
        changeType: queueTime > 10 ? "increase" : "decrease",
        icon: "Clock",
        trend: generateKPITrend(24, queueTime, 3),
      },
      {
        id: "staff-availability",
        label: "Staff Availability",
        value: staffAvailability,
        unit: "%",
        change: randomFloat(-3, 3),
        changeType: staffAvailability > 80 ? "decrease" : "increase",
        icon: "UsersRound",
        trend: generateKPITrend(24, staffAvailability, 5),
      },
      {
        id: "energy-consumption",
        label: "Energy Consumption",
        value: energyConsumption,
        unit: "kWh",
        change: randomFloat(-8, 8),
        changeType: energyConsumption > 500 ? "increase" : "decrease",
        icon: "Zap",
        trend: generateKPITrend(24, energyConsumption, 50),
      },
      {
        id: "revenue",
        label: "Revenue",
        value: revenue,
        unit: "$",
        change: randomFloat(2, 15),
        changeType: "increase",
        icon: "DollarSign",
        trend: generateKPITrend(24, revenue / 24, 5000),
      },
      {
        id: "fan-satisfaction",
        label: "Fan Satisfaction",
        value: fanSatisfaction,
        unit: "/5",
        change: randomFloat(-0.3, 0.3),
        changeType: fanSatisfaction > 4 ? "increase" : "decrease",
        icon: "Heart",
        trend: generateKPITrend(24, fanSatisfaction * 10, 1),
      },
    ];

    const incidentCount = emergencyAlerts + randomInt(1, 4);
    const incidents: Incident[] = Array.from({ length: incidentCount }, (_, i) => ({
      id: `inc-${i + 1}`,
      time: new Date(Date.now() - randomInt(0, 120) * 60000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      location: locations[randomInt(0, locations.length - 1)],
      type: incidentTypes[randomInt(0, incidentTypes.length - 1)],
      severity: (["critical", "high", "medium", "low"] as const)[randomInt(0, 3)],
      status: (["open", "dispatched", "resolved", "monitoring"] as const)[randomInt(0, 3)],
      assignedTeam: teams[randomInt(0, teams.length - 1)],
      aiRecommendation: "AI analysis available",
      description: `${incidentTypes[randomInt(0, incidentTypes.length - 1)]} reported at ${locations[randomInt(0, locations.length - 1)]}`,
    }));

    const activityEvents: ActivityEvent[] = Array.from({ length: 12 }, (_, i) => ({
      id: `evt-${i + 1}`,
      timestamp: new Date(Date.now() - i * randomInt(30, 300) * 1000).toISOString(),
      message: `${teams[randomInt(0, teams.length - 1)]} ${activityVerbs[randomInt(0, activityVerbs.length - 1)]} ${locations[randomInt(0, locations.length - 1)]}`,
      type: (["alert", "action", "system", "ai"] as const)[randomInt(0, 3)],
      severity: (["critical", "high", "medium", "low", "info"] as const)[randomInt(0, 4)],
      module: ["Crowd", "Security", "Parking", "Medical", "Facilities"][randomInt(0, 4)],
    }));

    const recommendations: AIRecommendation[] = [
      {
        id: "rec-1",
        action: "Open Gate D",
        location: "Gate D - East Entry",
        reason: "Crowd density approaching 85% at main entrance",
        expectedImpact: "Reduce queue time by 40%",
        confidence: 94,
        priority: "high",
        estimatedResolutionMinutes: 5,
        category: "crowd",
      },
      {
        id: "rec-2",
        action: "Deploy Security Staff",
        location: "Section 204-208",
        reason: "Unauthorized access attempt detected in VIP corridor",
        expectedImpact: "Secure perimeter and prevent escalation",
        confidence: 88,
        priority: "critical",
        estimatedResolutionMinutes: 8,
        category: "security",
      },
      {
        id: "rec-3",
        action: "Redirect Parking",
        location: "Parking Lot C",
        reason: "Lot C at 92% capacity. Overflow expected in 20 min",
        expectedImpact: "Prevent traffic congestion at West Entry",
        confidence: 96,
        priority: "high",
        estimatedResolutionMinutes: 15,
        category: "parking",
      },
      {
        id: "rec-4",
        action: "Increase Food Counter Capacity",
        location: "Food Court B",
        reason: "Queue predicted to exceed 20 min during halftime",
        expectedImpact: "Reduce wait time to under 10 min",
        confidence: 91,
        priority: "medium",
        estimatedResolutionMinutes: 12,
        category: "staff",
      },
      {
        id: "rec-5",
        action: "Delay Entry at Gate B",
        location: "Gate B",
        reason: "Concourse congestion at 90% capacity",
        expectedImpact: "Balance crowd flow across entries",
        confidence: 87,
        priority: "medium",
        estimatedResolutionMinutes: 10,
        category: "crowd",
      },
      {
        id: "rec-6",
        action: "Optimize Cleaning Schedule",
        location: "All Restrooms - West Wing",
        reason: "Restroom maintenance alerts triggered in 4 locations",
        expectedImpact: "Restore all facilities within 30 min",
        confidence: 93,
        priority: "low",
        estimatedResolutionMinutes: 25,
        category: "operations",
      },
    ];

    const now = Date.now();
    const generateTimeline = (count: number, minVal: number, maxVal: number, variance: number): ChartDataPoint[] =>
      Array.from({ length: count }, (_, i) => ({
        timestamp: new Date(now - (count - i) * 60000 * 5).toISOString(),
        value: randomFloat(minVal, maxVal),
        secondary: randomFloat(minVal * 0.7, maxVal * 0.9),
      }));

    const data: CommandCenterData = {
      stadium: {
        id: "st-1",
        name: "Lusail Iconic Stadium",
        location: "Lusail, Qatar",
        capacity: 75000,
      },
      tournament: {
        id: "t-1",
        name: "FIFA World Cup 2026",
        matchDay: 3,
        totalMatchDays: 7,
      },
      match,
      hero: {
        attendance,
        capacity,
        capacityPercent,
        weather: {
          condition: (["Clear", "Partly Cloudy", "Sunny", "Light Rain"] as const)[randomInt(0, 3)],
          temperature: randomInt(26, 38),
          icon: "sun",
        },
        riskLevel: emergencyAlerts > 0 ? "high" : crowdDensity > 75 ? "medium" : "low",
        aiHealthScore: randomFloat(92, 100),
      },
      summary: {
        summary: "",
        highlights: [],
        generatedAt: new Date().toISOString(),
      },
      kpis,
      recommendations,
      incidents: incidents.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      activityFeed: activityEvents.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
      attendanceTimeline: generateTimeline(24, 500, 3500, 200),
      crowdDensityTrend: generateTimeline(24, 30, 95, 5),
      parkingOccupancy: generateTimeline(24, 40, 98, 8),
      queueForecast: generateTimeline(24, 2, 25, 3),
      incidentTimeline: generateTimeline(24, 0, 5, 1),
      energyUsage: generateTimeline(24, 200, 850, 50),
      revenueTrend: generateTimeline(24, 8000, 120000, 5000),
    };

    data.summary = generateSummary(data);

    return data;
  },

  async getAIProviderStatus(): Promise<AIProviderStatus> {
    const rand = Math.random();
    if (rand > 0.95) return "down";
    if (rand > 0.85) return "degraded";
    return "operational";
  },

  async getActivityUpdates(): Promise<ActivityEvent[]> {
    const count = randomInt(1, 3);
    return Array.from({ length: count }, (_, i) => ({
      id: `live-${Date.now()}-${i}`,
      timestamp: new Date().toISOString(),
      message: `${teams[randomInt(0, teams.length - 1)]} ${activityVerbs[randomInt(0, activityVerbs.length - 1)]} ${locations[randomInt(0, locations.length - 1)]}`,
      type: (["alert", "action", "system", "ai"] as const)[randomInt(0, 3)],
      module: ["Crowd", "Security", "Parking", "Medical", "Facilities"][randomInt(0, 4)],
    }));
  },
};
