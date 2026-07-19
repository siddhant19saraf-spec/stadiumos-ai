import type {
  MaintenanceAsset, AssetHealth, FailurePrediction, WorkOrder, Alert,
  AnalyticsSummary, TrendData, SimulationResult,
} from "../types";
import { assetEngine } from "./asset-engine";
import { healthEngine } from "./health-engine";
import { predictionEngine } from "./prediction-engine";
import { maintenanceEngine } from "./maintenance-engine";
import { workOrderEngine } from "./work-order-engine";
import { simulationEngine } from "./simulation-engine";
import { analyticsEngine } from "./analytics-engine";
import { alertEngine } from "./alert-engine";

export interface PredictiveMaintenanceState {
  assets: MaintenanceAsset[];
  healthMap: Map<string, AssetHealth>;
  predictions: FailurePrediction[];
  workOrders: WorkOrder[];
  alerts: Alert[];
  summary: AnalyticsSummary | null;
  trends: TrendData[];
  assetTypeBreakdown: { type: string; count: number; avgHealth: number }[];
  simulationResult: SimulationResult | null;
  loading: boolean;
  lastUpdated: string | null;
}

export function createInitialState(): PredictiveMaintenanceState {
  return {
    assets: [],
    healthMap: new Map(),
    predictions: [],
    workOrders: [],
    alerts: [],
    summary: null,
    trends: [],
    assetTypeBreakdown: [],
    simulationResult: null,
    loading: false,
    lastUpdated: null,
  };
}

export interface IPredictiveMaintenanceService {
  initialize(): PredictiveMaintenanceState;
  refresh(state: PredictiveMaintenanceState): PredictiveMaintenanceState;
  simulateScenario(state: PredictiveMaintenanceState, scenarioId: string): PredictiveMaintenanceState;
  acknowledgeAlert(state: PredictiveMaintenanceState, alertId: string): PredictiveMaintenanceState;
  completeWorkOrder(state: PredictiveMaintenanceState, woId: string): PredictiveMaintenanceState;
}

export const predictiveMaintenanceService: IPredictiveMaintenanceService = {
  initialize(): PredictiveMaintenanceState {
    const assets = assetEngine.getAssets();
    const healthMap = assetEngine.simulateHealth(assets);
    const predictions = predictionEngine.predict(healthMap);
    const workOrders = workOrderEngine.generate(healthMap, assets);
    const alerts = alertEngine.generate(healthMap, predictions, workOrders);
    const summary = analyticsEngine.computeSummary(healthMap, predictions, workOrders);
    const trends = analyticsEngine.computeTrends(healthMap);
    const assetTypeBreakdown = analyticsEngine.computeAssetTypeBreakdown(healthMap);

    return {
      assets,
      healthMap,
      predictions,
      workOrders,
      alerts,
      summary,
      trends,
      assetTypeBreakdown,
      simulationResult: null,
      loading: false,
      lastUpdated: new Date().toISOString(),
    };
  },

  refresh(state: PredictiveMaintenanceState): PredictiveMaintenanceState {
    const healthMap = assetEngine.simulateHealth(state.assets);
    const predictions = predictionEngine.predict(healthMap);
    const workOrders = workOrderEngine.generate(healthMap, state.assets);
    const alerts = alertEngine.generate(healthMap, predictions, workOrders);
    const summary = analyticsEngine.computeSummary(healthMap, predictions, workOrders);
    const trends = analyticsEngine.computeTrends(healthMap);
    const assetTypeBreakdown = analyticsEngine.computeAssetTypeBreakdown(healthMap);

    return {
      ...state,
      healthMap,
      predictions,
      workOrders,
      alerts,
      summary,
      trends,
      assetTypeBreakdown,
      loading: false,
      lastUpdated: new Date().toISOString(),
    };
  },

  simulateScenario(state: PredictiveMaintenanceState, scenarioId: string): PredictiveMaintenanceState {
    const result = simulationEngine.run(state.healthMap, state.predictions, state.workOrders, scenarioId);
    return { ...state, simulationResult: result, loading: false };
  },

  acknowledgeAlert(state: PredictiveMaintenanceState, alertId: string): PredictiveMaintenanceState {
    const alerts = alertEngine.acknowledge(alertId, state.alerts);
    return { ...state, alerts };
  },

  completeWorkOrder(state: PredictiveMaintenanceState, woId: string): PredictiveMaintenanceState {
    const workOrders = workOrderEngine.complete(woId, state.workOrders);
    return { ...state, workOrders };
  },
};
