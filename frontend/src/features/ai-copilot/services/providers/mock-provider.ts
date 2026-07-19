import type {
  AIProvider,
  AIProviderResponse,
  OperationalContext,
  AIReasoning,
  ActiveRisk,
  PredictedProblem,
} from "../../types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function picks<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const riskTemplates: Array<Omit<ActiveRisk, "id" | "timestamp">> = [
  { title: "East Gate Congestion", description: "Crowd density at East Gate has reached 87%, approaching critical threshold", level: "high", location: "East Gate", module: "Crowd", trend: "increasing", probability: 92 },
  { title: "Parking Lot C Near Capacity", description: "Parking Lot C is at 94% occupancy. Overflow expected within 25 minutes", level: "high", location: "Parking Lot C", module: "Parking", trend: "increasing", probability: 88 },
  { title: "Food Court B Queue Spiking", description: "Queue at Food Court B has grown to 18 minutes, predicted to reach 25 minutes by halftime", level: "medium", location: "Food Court B", module: "Queue", trend: "increasing", probability: 85 },
  { title: "Security Coverage Gap - Section 312", description: "Only 1 steward assigned to Section 312 for current crowd level of 340 people", level: "medium", location: "Section 312", module: "Staff", trend: "stable", probability: 75 },
  { title: "Temperature Rise in Server Room", description: "North server room temperature at 31°C, approaching warning threshold of 35°C", level: "low", location: "Server Room North", module: "Maintenance", trend: "increasing", probability: 60 },
  { title: "VIP Corridor Unauthorized Access", description: "Motion sensor detected unauthorized movement in VIP East Corridor", level: "high", location: "VIP East Corridor", module: "Security", trend: "stable", probability: 80 },
  { title: "West Concourse Overcapacity", description: "West Concourse at 91% capacity, creating bottleneck at staircase access", level: "critical", location: "West Concourse", module: "Crowd", trend: "increasing", probability: 95 },
  { title: "Medical Station 2 Low Supplies", description: "Medical Station 2 reporting low inventory of first aid supplies", level: "low", location: "Medical Station 2", module: "Operations", trend: "stable", probability: 40 },
  { title: "Rain Expected at Entry Time", description: "Weather radar shows 70% probability of rain during next entry window", level: "medium", location: "All Gates", module: "Operations", trend: "stable", probability: 70 },
  { title: "Energy Spike in South Wing", description: "South wing energy consumption 35% above normal pattern", level: "low", location: "South Wing", module: "Energy", trend: "increasing", probability: 55 },
];

const problemTemplates: Array<Omit<PredictedProblem, "id">> = [
  { title: "Gate B Overcrowding", detail: "Crowd flow models predict Gate B will exceed safe capacity within 30 minutes if no intervention", timeToOccur: "25-30 min", probability: 88, severity: "high", affectedArea: "Gate B", recommendedAction: "Open auxiliary entry at Gate B2 and redirect 30% of flow" },
  { title: "Parking Overflow Cascade", detail: "Once Parking Lot C reaches 100%, overflow will cascade to Lot D which is already at 68%", timeToOccur: "20-25 min", probability: 82, severity: "high", affectedArea: "Parking Lots C, D", recommendedAction: "Activate overflow protocol and redirect to Lot E (23% capacity)" },
  { title: "Halftime Queue Crisis", detail: "Concession queues predicted to spike to 30+ minutes at all Food Courts during halftime surge", timeToOccur: "18-22 min", probability: 92, severity: "high", affectedArea: "All Food Courts", recommendedAction: "Activate all standby counters and deploy 4 additional staff per court" },
  { title: "Security Response Bottleneck", detail: "Current security staff deployment leaves West Stand entry with only 40% recommended coverage", timeToOccur: "Continuous", probability: 75, severity: "medium", affectedArea: "West Stand Entries", recommendedAction: "Reassign 2 security units from North Stand (low traffic) to West entries" },
  { title: "EV Charger Capacity Exceeded", detail: "EV charging stations at 85% usage with 45-minute average session time", timeToOccur: "15-20 min", probability: 70, severity: "low", affectedArea: "Parking EV Zone", recommendedAction: "Activate demand-based pricing and notify EV drivers of Lot B alternative chargers" },
  { title: "Concourse Temperature Risk", detail: "East Concourse HVAC showing reduced cooling capacity; temperature may rise 4°C in next hour", timeToOccur: "35-45 min", probability: 65, severity: "medium", affectedArea: "East Concourse", recommendedAction: "Dispatch maintenance to HVAC unit E-3 and deploy portable cooling units" },
  { title: "Medical Coverage Deficit", detail: "Current fan count of 48,000 requires minimum 6 medical teams; only 4 are on duty", timeToOccur: "Current", probability: 80, severity: "high", affectedArea: "Stadium-wide", recommendedAction: "Activate 2 additional medical teams from standby roster" },
  { title: "Broadcast Power Fluctuation", detail: "Backup power system for broadcast center showing intermittent voltage fluctuation", timeToOccur: "10-15 min", probability: 55, severity: "medium", affectedArea: "Broadcast Center", recommendedAction: "Switch broadcast feed to primary UPS and dispatch electrical team" },
];

const summaryTemplates = [
  "All critical systems operational. Stadium is functioning within normal parameters with no immediate threats detected.",
  "Operations stable. Moderate crowd density requires monitoring at East and West concourses. Parking approaching capacity.",
  "Multiple systems requiring attention. Crowd density elevated in 3 zones. Parking near capacity. Queue times increasing ahead of halftime.",
  "High alert status. Critical crowd density at West Concourse. Parking overflow imminent. Security incident in VIP corridor requires immediate response.",
  "Operations proceeding as expected for match day 3. All AI systems performing with 97% accuracy. Recommend standard monitoring cadence.",
];

function generateReasoning(
  context: OperationalContext,
  query?: string,
): AIReasoning {
  const priorities: AIReasoning["priority"][] = ["critical", "high", "medium", "low"];
  const priority = context.emergencyAlerts > 0 ? "critical" : context.crowdDensity > 80 ? "high" : "medium";

  const evidence = [
    `Crowd density at ${context.crowdDensity}% (${context.crowdDensity > 75 ? "elevated" : "normal"} levels)`,
    `Parking occupancy: ${context.parkingOccupancy}% (${context.parkingOccupancy > 85 ? "near capacity" : "available spaces remaining"})`,
    `Queue times averaging ${context.avgQueueTime} minutes across all concessions`,
    `Staff availability at ${context.staffAvailability}% (${context.staffAvailability < 80 ? "below" : "meeting"} minimum thresholds)`,
    `Weather: ${context.weather}, ${context.temperature}°C`,
    `Active alerts: ${context.emergencyAlerts}`,
  ];

  if (context.activeRisks.length > 0) {
    evidence.push(`High-priority risk: ${context.activeRisks[0]!.title}`);
  }

  return {
    summary: query
      ? `Analysis complete for: "${query}". Based on current operational data, I recommend focused action in ${context.crowdDensity > 75 ? "crowd management" : context.parkingOccupancy > 85 ? "parking operations" : "standard monitoring"}.`
      : picks(summaryTemplates),
    evidence,
    confidence: randomInt(82, 98),
    priority,
    recommendedAction: picks([
      "Open auxiliary entry gates to reduce main gate congestion",
      "Deploy additional staff to food courts ahead of halftime surge",
      "Activate parking overflow protocol for Lot C",
      "Dispatch security reinforcement to West Concourse",
      "Increase monitoring frequency for East Gate zone",
      "Continue current operations with standard monitoring",
    ]),
    expectedOutcome: picks([
      "Queue times reduced by 30-40% within 10 minutes",
      "Crowd density distributed evenly across all zones",
      "Parking capacity extended by additional 45 minutes",
      "Security coverage restored to recommended levels",
      "Fan satisfaction maintained above 4.2/5",
    ]),
  };
}

function generateSuggestions(context: OperationalContext): string[] {
  const suggestions: string[] = [];
  if (context.crowdDensity > 70) suggestions.push("Show crowd heatmap and pinch points");
  if (context.parkingOccupancy > 80) suggestions.push("Where should I redirect parking?");
  if (context.emergencyAlerts > 0) suggestions.push("Show emergency status overview");
  if (context.avgQueueTime > 10) suggestions.push("How can I reduce queue times?");
  if (context.staffAvailability < 80) suggestions.push("Optimize staff allocation");
  suggestions.push("What should I do right now?");
  suggestions.push("Summarize today's operations");
  suggestions.push("Any predicted problems in next 30 minutes?");
  return suggestions.slice(0, 5);
}

function buildAIResponse(context: OperationalContext, query?: string): AIProviderResponse {
  const reasoning = generateReasoning(context, query);

  const content = [
    `## ${reasoning.summary}`,
    "",
    reasoning.evidence.length > 0 && "**Evidence:**",
    ...reasoning.evidence.map((e) => `- ${e}`),
    "",
    `**Recommended Action:** ${reasoning.recommendedAction}`,
    `**Expected Outcome:** ${reasoning.expectedOutcome}`,
    `**Confidence:** ${reasoning.confidence}%`,
    `**Priority:** ${reasoning.priority.toUpperCase()}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    content,
    reasoning,
    suggestions: generateSuggestions(context),
    raw: content,
  };
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async analyze(context: OperationalContext): Promise<AIProviderResponse> {
    await new Promise((r) => setTimeout(r, 600 + randomInt(200, 800)));
    return buildAIResponse(context);
  }

  async query(context: OperationalContext, question: string): Promise<AIProviderResponse> {
    await new Promise((r) => setTimeout(r, 400 + randomInt(100, 600)));

    if (/risk/i.test(question)) {
      const reasoning = generateReasoning(context, question);
      reasoning.summary = `I've identified ${context.activeRisks.length + randomInt(0, 2)} active risks requiring attention. The most critical is related to ${context.crowdDensity > 75 ? "crowd congestion" : context.parkingOccupancy > 85 ? "parking capacity" : "operational monitoring"}.`;
      return {
        content: [`## ${reasoning.summary}`, "", "**Top Risks:**", ...context.activeRisks.slice(0, 3).map((r) => `- **${r.title}** (${r.level}): ${r.description}`), "", `**Recommended Action:** ${reasoning.recommendedAction}`, `**Confidence:** ${reasoning.confidence}%`].join("\n"),
        reasoning,
        suggestions: generateSuggestions(context),
        raw: "",
      };
    }

    if (/parking/i.test(question)) {
      return this.generateAlert(context, "parking query");
    }

    if (/security|deploy/i.test(question)) {
      const reasoning = generateReasoning(context, question);
      reasoning.summary = `Based on security analysis, I recommend ${context.activeRisks.some((r) => r.module === "Security") ? "immediate reinforcement at VIP East Corridor" : "maintaining current deployment with enhanced monitoring"}.`;
      return { content: `## ${reasoning.summary}\n\n**Evidence:** Security coverage analysis complete\n**Recommended Action:** ${reasoning.recommendedAction}\n**Confidence:** ${reasoning.confidence}%`, reasoning, suggestions: generateSuggestions(context), raw: "" };
    }

    if (/crowd|movement/i.test(question)) {
      const reasoning = generateReasoning(context, question);
      reasoning.summary = `Crowd movement analysis shows ${context.crowdDensity > 75 ? "elevated density requiring intervention" : "normal flow patterns with no immediate concerns"}.`;
      return { content: `## ${reasoning.summary}\n\n**Evidence:** Real-time crowd sensor analysis complete\n**Recommended Action:** ${reasoning.recommendedAction}\n**Confidence:** ${reasoning.confidence}%`, reasoning, suggestions: generateSuggestions(context), raw: "" };
    }

    return buildAIResponse(context, question);
  }

  async generateAlert(context: OperationalContext, trigger: string): Promise<AIProviderResponse> {
    await new Promise((r) => setTimeout(r, 300));

    const matchingRisks = context.activeRisks.filter(
      (r) => trigger.toLowerCase().includes(r.module.toLowerCase()) || trigger.toLowerCase().includes("all"),
    );

    const risk = matchingRisks.length > 0 ? matchingRisks[0]! : picks(riskTemplates);

    const reasoning: AIReasoning = {
      summary: `**PROACTIVE ALERT:** ${risk.title}`,
      evidence: [risk.description, `Probability: ${risk.probability}%`, `Location: ${risk.location ?? "Multiple areas"}`],
      confidence: risk.probability,
      priority: risk.level === "critical" ? "critical" : risk.level === "high" ? "high" : "medium",
      recommendedAction: risk.level === "critical" || risk.level === "high"
        ? "Immediate action required. Dispatch response team and activate contingency plan."
        : "Monitor situation. Prepare resources for potential escalation.",
      expectedOutcome: "Risk mitigated within operational parameters",
    };

    return {
      content: `## 🚨 ${risk.title}\n\n${risk.description}\n\n**Location:** ${risk.location ?? "Stadium-wide"}\n**Probability:** ${risk.probability}%\n**Priority:** ${risk.level.toUpperCase()}\n\n**Recommended Action:** ${reasoning.recommendedAction}\n\n**Evidence:**\n- Real-time sensor data confirms trend\n- Historical pattern matching: ${risk.probability}% accuracy\n- Current trajectory: ${risk.trend === "increasing" ? "Worsening" : "Stable"}`,
      reasoning,
      suggestions: ["What actions should I take?", "Show affected area", "Deploy response team"],
      raw: "",
    };
  }

  async compareDecisions(
    context: OperationalContext,
    _scenario: string,
    _options: string[],
  ): Promise<{ recommendation: string; reasoning: AIReasoning }> {
    await new Promise((r) => setTimeout(r, 500));

    const reasoning: AIReasoning = {
      summary: "After comparing available options, I recommend Option A with enhanced monitoring as a contingency.",
      evidence: [
        "Option A addresses the root cause with 40% more effectiveness",
        "Option B requires 30% more staff resources",
        "Combined approach reduces overall risk by 85%",
      ],
      confidence: 92,
      priority: "high",
      recommendedAction: "Execute Option A immediately while preparing Option B as backup",
      expectedOutcome: "85% risk reduction with optimal resource utilization",
      alternatives: [
        {
          label: "Option A: Open Additional Gates",
          action: "Open Gate D and Gate E auxiliary entries",
          expectedReduction: "40% crowd reduction at main gates",
          implementationCost: "low",
          risk: "low",
          implementationTime: "5 min",
          confidence: 92,
        },
        {
          label: "Option B: Increase Security Presence",
          action: "Deploy 6 additional security staff to congestion points",
          expectedReduction: "35% incident probability reduction",
          implementationCost: "medium",
          risk: "low",
          requiredStaff: 6,
          implementationTime: "12 min",
          confidence: 85,
        },
      ],
    };

    return {
      recommendation: "Option A: Open additional gates with coordinated staff deployment",
      reasoning,
    };
  }

  async summarize(context: OperationalContext): Promise<AIProviderResponse> {
    await new Promise((r) => setTimeout(r, 500));
    const healthy = context.emergencyAlerts === 0 && context.crowdDensity < 75;
    const summary = healthy
      ? `## Operations Summary — All Systems Nominal\n\nStadium operations are proceeding smoothly. Attendance at ${Math.round((context.attendance / context.capacity) * 100)}% capacity with stable crowd distribution. No critical incidents reported. Revenue tracking at $${context.revenue.toLocaleString()}.`
      : `## Operations Summary — Action Required\n\n${context.emergencyAlerts} active incident(s) require attention. Crowd density elevated at ${context.crowdDensity}%. Parking at ${context.parkingOccupancy}%. Recommend reviewing active risks panel for prioritized actions.`;

    return {
      content: summary,
      reasoning: generateReasoning(context),
      suggestions: generateSuggestions(context),
      raw: summary,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getRisks(): ActiveRisk[] {
    const count = randomInt(2, 5);
    return Array.from({ length: count }, (_, i) => {
      const t = riskTemplates[i % riskTemplates.length] ?? riskTemplates[0]!;
      return {
        ...t,
        id: `risk-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
      };
    });
  }

  getPredictedProblems(): PredictedProblem[] {
    const count = randomInt(2, 4);
    return Array.from({ length: count }, (_, i) => {
      const t = problemTemplates[i % problemTemplates.length] ?? problemTemplates[0]!;
      return { ...t, id: `prob-${Date.now()}-${i}` };
    });
  }
}
