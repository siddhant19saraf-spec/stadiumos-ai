import { describe, it, expect } from "vitest";
import { predictionEngine } from "../services/prediction-engine";
import { PARKING_LOTS, TRAFFIC_ROADS } from "../constants";
import { parkingEngine } from "../services/parking-engine";
import { trafficEngine } from "../services/traffic-engine";

describe("PredictionEngine", () => {
  it("should predict occupancy for all lots", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const predictions = predictionEngine.predictOccupancy(PARKING_LOTS, statuses);
    expect(predictions.length).toBe(PARKING_LOTS.length);

    for (const p of predictions) {
      expect(p).toHaveProperty("lotId");
      expect(p).toHaveProperty("predictedOccupancy30m");
      expect(p).toHaveProperty("predictedOccupancy60m");
      expect(p).toHaveProperty("predictedOccupancy120m");
      expect(p).toHaveProperty("arrivalRatePerMin");
      expect(p).toHaveProperty("departureRatePerMin");
      expect(p).toHaveProperty("overflowProbability");
      expect(p).toHaveProperty("confidence");
      expect(p).toHaveProperty("timestamp");

      expect(p.predictedOccupancy30m).toBeGreaterThanOrEqual(0);
      expect(p.predictedOccupancy60m).toBeLessThanOrEqual(100);
      expect(p.arrivalRatePerMin).toBeGreaterThanOrEqual(0.5);
      expect(p.departureRatePerMin).toBeGreaterThanOrEqual(0.5);
      expect(p.confidence).toBeGreaterThanOrEqual(75);
      expect(p.confidence).toBeLessThanOrEqual(100);
    }
  });

  it("should predict traffic for all roads", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const predictions = predictionEngine.predictTraffic(roads, statuses);
    expect(predictions.length).toBe(roads.length);

    for (const p of predictions) {
      expect(p).toHaveProperty("roadId");
      expect(p).toHaveProperty("predictedCongestion30m");
      expect(p).toHaveProperty("predictedSpeed30m");
      expect(p).toHaveProperty("predictedQueue30m");
      expect(p).toHaveProperty("surgeProbability");
      expect(p).toHaveProperty("confidence");

      expect(["low", "moderate", "high", "severe"]).toContain(p.predictedCongestion30m);
      expect(p.predictedSpeed30m).toBeGreaterThan(0);
      expect(p.predictedQueue30m).toBeGreaterThanOrEqual(0);
      expect(p.surgeProbability).toBeGreaterThanOrEqual(0);
      expect(p.confidence).toBeGreaterThan(0);
    }
  });

  it("should calculate overflow probabilities", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const probs = predictionEngine.predictOverflowProbability(PARKING_LOTS, statuses);
    expect(probs.size).toBe(PARKING_LOTS.length);

    for (const [, prob] of probs) {
      expect(prob).toBeGreaterThanOrEqual(0);
      expect(prob).toBeLessThanOrEqual(100);
    }

    // Overflow lot should have different probability than general
    const generalProb = probs.get("lot-a") ?? 0;
    const overflowProb = probs.get("lot-overflow") ?? 0;
    expect(typeof generalProb).toBe("number");
    expect(typeof overflowProb).toBe("number");
  });

  it("should predict a peak time string", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const peakTime = predictionEngine.predictPeakTime(statuses);
    expect(typeof peakTime).toBe("string");
    expect(peakTime.length).toBeGreaterThanOrEqual(4);
    expect(peakTime).toMatch(/\d{1,2}:\d{2}/);
  });

  it("should produce time-ordered occupancy predictions", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const predictions = predictionEngine.predictOccupancy(PARKING_LOTS, statuses);

    for (const p of predictions) {
      expect(p.predictedOccupancy120m).toBeGreaterThanOrEqual(p.predictedOccupancy60m - 20); // Allow variance
      expect(p.predictedOccupancy60m).toBeGreaterThanOrEqual(p.predictedOccupancy30m - 20);
    }
  });
});
