import type { OperationalContext } from "../types";

export function buildFullContext(ctx: OperationalContext): string {
  return [
    "=== STADIUM OPERATIONAL CONTEXT ===",
    `Stadium: ${ctx.stadiumName}`,
    `Tournament: ${ctx.tournamentName}`,
    `Current Match: ${ctx.currentMatch}`,
    `Time: ${ctx.timeOfDay} | Phase: ${ctx.eventPhase}`,
    "",
    "=== KEY METRICS ===",
    `Attendance: ${ctx.attendance.toLocaleString()} / ${ctx.capacity.toLocaleString()} (${Math.round((ctx.attendance / ctx.capacity) * 100)}%)`,
    `Weather: ${ctx.weather}, ${ctx.temperature}°C`,
    `Crowd Density: ${ctx.crowdDensity}%`,
    `Parking Occupancy: ${ctx.parkingOccupancy}%`,
    `Average Queue Time: ${ctx.avgQueueTime} minutes`,
    `Staff Availability: ${ctx.staffAvailability}%`,
    `Active Emergency Alerts: ${ctx.emergencyAlerts}`,
    `Energy Usage: ${ctx.energyUsage} kWh`,
    `Revenue: $${ctx.revenue.toLocaleString()}`,
    `Fan Satisfaction: ${ctx.fanSatisfaction}/5`,
    "",
    "=== ACTIVE RISKS ===",
    ...ctx.activeRisks.map((r) => `[${r.level.toUpperCase()}] ${r.title} - ${r.description} (Location: ${r.location ?? "N/A"}, Probability: ${r.probability}%)`),
    "",
    "=== PREDICTED PROBLEMS ===",
    ...ctx.predictedProblems.map((p) => `[${p.severity.toUpperCase()}] ${p.title} - ${p.detail} (Expected in: ${p.timeToOccur}, Probability: ${p.probability}%)`),
    "",
    "=== INSTRUCTIONS ===",
    "Analyze this data and provide:",
    "1. A concise operational summary",
    "2. The top 3 risks requiring immediate attention",
    "3. Predicted problems in the next 60 minutes",
    "4. Specific recommended actions with priorities",
    "5. Any resource reallocation suggestions",
  ].join("\n");
}

export function buildQueryContext(ctx: OperationalContext, query: string): string {
  return [
    "=== CURRENT CONTEXT ===",
    `Stadium capacity at ${Math.round((ctx.attendance / ctx.capacity) * 100)}%`,
    `Crowd density: ${ctx.crowdDensity}%`,
    `Parking: ${ctx.parkingOccupancy}% full`,
    `Weather: ${ctx.weather}, ${ctx.temperature}°C`,
    `Emergency alerts: ${ctx.emergencyAlerts}`,
    `Staff availability: ${ctx.staffAvailability}%`,
    "",
    `=== OPERATOR QUERY ===`,
    query,
    "",
    "=== RESPONSE REQUIREMENTS ===",
    "Provide: summary, reasoning, evidence, confidence score (0-100), priority (critical/high/medium/low), recommended action, expected outcome.",
  ].join("\n");
}
