import { describe, it, expect } from "vitest";
import { predictionEngine } from "../services/prediction-engine";
import { QUEUE_POINTS } from "../constants";
import { queueEngine } from "../services/queue-engine";

describe("PredictionEngine", () => {
  it("should predict queues for all points", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const predictions = predictionEngine.predictQueues(QUEUE_POINTS, statuses);
    expect(predictions.length).toBe(QUEUE_POINTS.length);

    for (const p of predictions) {
      expect(p).toHaveProperty("queuePointId");
      expect(p).toHaveProperty("predictedLength15m");
      expect(p).toHaveProperty("predictedLength30m");
      expect(p).toHaveProperty("predictedWait15m");
      expect(p).toHaveProperty("predictedWait30m");
      expect(p).toHaveProperty("peakDemandTime");
      expect(p).toHaveProperty("overloadProbability");
      expect(p).toHaveProperty("abandonmentRate");
      expect(p).toHaveProperty("recommendedCounters");
      expect(p).toHaveProperty("confidence");

      expect(p.predictedLength15m).toBeGreaterThanOrEqual(0);
      expect(p.predictedLength30m).toBeGreaterThanOrEqual(0);
      expect(p.predictedWait15m).toBeGreaterThanOrEqual(1);
      expect(p.predictedWait30m).toBeGreaterThanOrEqual(1);
      expect(p.overloadProbability).toBeGreaterThanOrEqual(0);
      expect(p.overloadProbability).toBeLessThanOrEqual(100);
      expect(p.confidence).toBeGreaterThanOrEqual(75);
      expect(p.confidence).toBeLessThanOrEqual(100);
      expect(p.recommendedCounters).toBeGreaterThanOrEqual(1);
    }
  });

  it("should identify overload risks", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    // Add some high congestion manually
    const overloads = predictionEngine.predictOverload(statuses);
    expect(Array.isArray(overloads)).toBe(true);
    for (const o of overloads) {
      expect(o).toHaveProperty("id");
      expect(o).toHaveProperty("probability");
      expect(o).toHaveProperty("timeToCritical");
      expect(o.probability).toBeGreaterThanOrEqual(0);
    }
  });

  it("should have time-ordered predictions (15m <= 30m generally)", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const predictions = predictionEngine.predictQueues(QUEUE_POINTS, statuses);
    for (const p of predictions) {
      expect(p.predictedLength30m).toBeGreaterThanOrEqual(p.predictedLength15m - 20);
      expect(p.predictedWait30m).toBeGreaterThanOrEqual(p.predictedWait15m - 10);
    }
  });

  it("should predict a valid peak time string", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const predictions = predictionEngine.predictQueues(QUEUE_POINTS, statuses);
    for (const p of predictions) {
      expect(p.peakDemandTime).toMatch(/\d{2}:\d{2}/);
    }
  });
});
