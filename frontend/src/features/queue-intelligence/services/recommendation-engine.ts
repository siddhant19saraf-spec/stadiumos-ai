import type { QueueRecommendation, QueuePointStatus, QueueAlert, InventoryItem } from "../types";


function uid(): string {
  return `rec-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

export interface IRecommendationEngine {
  generate(situation: { statuses: Map<string, QueuePointStatus>; alerts: QueueAlert[]; inventory: Map<string, InventoryItem> }): QueueRecommendation[];
}

export class MockRecommendationEngine implements IRecommendationEngine {
  generate(situation: { statuses: Map<string, QueuePointStatus>; alerts: QueueAlert[]; inventory: Map<string, InventoryItem> }): QueueRecommendation[] {
    const { statuses, inventory } = situation;
    const recs: QueueRecommendation[] = [];

    const criticalQueues = Array.from(statuses.values()).filter((q) => q.status === "critical");
    const congestedQueues = Array.from(statuses.values()).filter((q) => q.status === "congested");

    for (const q of criticalQueues.slice(0, 2)) {
      const closedCounters = q.counterStatuses.filter((c) => c === "closed" || c === "breakdown").length;
      if (closedCounters > 0 && q.activeCounters < q.totalCounters) {
        recs.push(this.makeRec(
          `Open Counter ${q.activeCounters + 1} at ${q.queuePointName}`,
          `${closedCounters} counters currently closed. Opening additional counter reduces wait time from ${q.estimatedWaitMin} min to estimated ${Math.round(q.estimatedWaitMin * 0.6)} min.`,
          "urgent", q.queuePointId, q.queuePointName,
          ["Queue length: " + q.currentLength + " people", "Wait time: " + q.estimatedWaitMin + " min", "Active counters: " + q.activeCounters + "/" + q.totalCounters],
          ["Counter availability", "Demand surge at " + q.queuePointName],
          "Reduces queue length by 40%", "Estimated 8 min wait reduction",
        ));
      } else {
        recs.push(this.makeRec(
          `Deploy Additional Staff to ${q.queuePointName}`,
          `Queue at critical level with all counters open. Additional staffing can increase service speed by 25%.`,
          "urgent", q.queuePointId, q.queuePointName,
          ["All counters active but queue at " + q.currentLength, "Current service speed: " + q.serviceSpeedSec + "s", "Satisfaction: " + q.customerSatisfaction + "/5"],
          ["Peak demand period", "Full counter deployment reached"],
          "Increases service throughput by 25%", "Estimated 5 min wait reduction",
        ));
      }
    }

    for (const q of congestedQueues.slice(0, 2)) {
      if (q.activeCounters < q.totalCounters) {
        recs.push(this.makeRec(
          `Open Additional Counter at ${q.queuePointName}`,
          `Queue congestion detected. ${q.totalCounters - q.activeCounters} counters available to open.`,
          "high", q.queuePointId, q.queuePointName,
          ["Current wait: " + q.estimatedWaitMin + " min", "Available counters: " + (q.totalCounters - q.activeCounters)],
          ["Congestion level: " + q.status, "Counter headroom available"],
          "Prevents escalation to critical", "Estimated 3 min wait reduction",
        ));
      }
    }

    const longRestroom = Array.from(statuses.values()).filter((q) => q.type === "restroom" && q.estimatedWaitMin > 8);
    for (const q of longRestroom.slice(0, 2)) {
      recs.push(this.makeRec(
        `Redirect Visitors from ${q.queuePointName}`,
        `Restroom queue at ${q.estimatedWaitMin} min wait. ${this.alternateRestroom(q.queuePointId)} restroom has shorter queue.`,
        "medium", q.queuePointId, q.queuePointName,
        ["Wait time exceeds 8 min threshold", "Direct visitors to alternate facilities"],
        ["Restroom capacity utilization: " + q.capacityUtilization + "%", "Event phase causing high demand"],
        "Distributes load across facilities", "Redirects 30% of visitors",
      ));
    }

    const foodQueues = Array.from(statuses.values()).filter((q) => q.type === "food_counter" && q.status === "busy");
    if (foodQueues.length >= 2) {
      const best = foodQueues.reduce((a, b) => a.estimatedWaitMin < b.estimatedWaitMin ? a : b);
      recs.push(this.makeRec(
        `Redirect Visitors to ${best.queuePointName}`,
        `${best.queuePointName} has shortest wait at ${best.estimatedWaitMin} min. Broadcast queue guidance via app and signage.`,
        "medium", best.queuePointId, best.queuePointName,
        ["Shortest food queue in stadium", "Average food wait: " + (foodQueues.reduce((s, q) => s + q.estimatedWaitMin, 0) / foodQueues.length).toFixed(0) + " min"],
        ["Uneven demand distribution across food courts"],
        "Balances queue distribution", "Reduces peak wait by 20%",
      ));
    }

    for (const [, item] of inventory) {
      if (item.restockPriority === "critical" || item.restockPriority === "high") {
        recs.push(this.makeRec(
          `Replenish ${item.name} Immediately`,
          `${item.name} stock at ${item.currentStock}/${item.maxStock}. Estimated shortage in ${item.predictedShortageInMin ?? "N/A"} min.`,
          item.restockPriority === "critical" ? "urgent" : "high",
          "inventory", item.name,
          ["Current stock: " + item.currentStock, "Reorder point: " + item.reorderPoint, "Daily demand: " + item.dailyDemand],
          ["High demand depleting inventory faster than forecast", "Waste rate: " + item.wastePercent + "%"],
          "Prevents menu item unavailability", "Maintains 30 min buffer stock",
        ));
      }
    }

    if (criticalQueues.length > 1 && congestedQueues.length > 2) {
      recs.push(this.makeRec(
        "Broadcast Queue Guidance to All Visitors",
        `${criticalQueues.length} queues critical, ${congestedQueues.length} congested. Broadcast real-time wait times to redirect visitors.`,
        "high", "stadium-wide", "Stadium-Wide",
        ["Critical queues: " + criticalQueues.map((q) => q.queuePointName).join(", ")],
        ["Multiple concurrent congestion points", "Visitor distribution imbalance"],
        "Improves visitor flow by 25%", "Distributes demand evenly",
      ));
    }

    return recs.slice(0, 8);
  }

  private alternateRestroom(currentId: string): string {
    const alternates: Record<string, string> = {
      "restroom-1": "Restroom - South", "restroom-2": "Restroom - North",
      "restroom-3": "Restroom - West", "restroom-4": "Restroom - East",
    };
    return alternates[currentId] ?? "nearby";
  }

  private makeRec(action: string, detail: string, priority: "urgent" | "high" | "medium" | "low", locId: string, locName: string, reasoning: string[], factors: string[], impact: string, improvement: string): QueueRecommendation {
    return {
      id: uid(), action, detail, priority, locationId: locId, locationName: locName,
      reasoning, contributingFactors: factors, operationalImpact: impact,
      estimatedImprovement: improvement, confidence: Math.round(80 + Math.random() * 17),
      timestamp: new Date().toISOString(),
    };
  }
}

export const recommendationEngine = new MockRecommendationEngine();

