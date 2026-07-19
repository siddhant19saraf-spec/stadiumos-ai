export type UtilityType = "electricity" | "water" | "gas" | "solar" | "steam" | "chilled_water";
export type EnergySource = "grid" | "solar" | "generator" | "battery" | "renewable";
export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AlertCategory =
  | "power_spike" | "water_leak" | "high_carbon" | "energy_waste"
  | "waste_overflow" | "generator_inefficiency" | "cooling_inefficiency"
  | "water_demand" | "solar_drop" | "battery_degradation" | "emission_breach";
export type SimulationScenarioId =
  | "heatwave" | "power_outage" | "heavy_rain" | "water_shortage"
  | "solar_failure" | "generator_failure" | "peak_match_day" | "full_stadium";
export type ZoneType =
  | "north_stand" | "south_stand" | "east_stand" | "west_stand"
  | "main_concourse" | "vip_lounge" | "basement" | "parking" | "roof" | "kitchen";

export interface Coordinates { x: number; y: number; }

export interface EnergyAsset {
  id: string;
  name: string;
  type: "hvac" | "lighting" | "scoreboard" | "video_wall" | "kitchen" | "ev_charger"
       | "networking" | "security" | "generator" | "power_distribution" | "solar_panel" | "battery_storage";
  zone: ZoneType;
  location: string;
  ratedPowerKw: number;
  criticality: "critical" | "high" | "medium" | "low";
  source: EnergySource;
}

export interface WaterAsset {
  id: string;
  name: string;
  type: "restroom" | "irrigation" | "cooling_tower" | "cleaning" | "food_court"
       | "storage_tank" | "pump" | "pipe";
  zone: ZoneType;
  location: string;
  capacityLiters: number;
  criticality: "critical" | "high" | "medium" | "low";
}

export interface WasteAsset {
  id: string;
  name: string;
  type: "food_waste" | "plastic" | "paper" | "recyclable" | "organic" | "hazardous";
  zone: ZoneType;
  location: string;
  capacityKg: number;
  collectionSchedule: string;
}

export interface EnergyMetrics {
  assetId: string;
  assetName: string;
  consumptionKw: number;
  demandKw: number;
  peakDemandKw: number;
  voltage: number;
  currentA: number;
  powerFactor: number;
  temperature: number;
  efficiency: number;
  source: EnergySource;
  co2Intensity: number;
  costPerKwh: number;
  timestamp: string;
}

export interface WaterMetrics {
  assetId: string;
  assetName: string;
  flowRateLmin: number;
  totalConsumptionL: number;
  pressureBar: number;
  temperature: number;
  ph: number;
  turbidity: number;
  leakProbability: number;
  backflowRisk: number;
  timestamp: string;
}

export interface WasteMetrics {
  assetId: string;
  assetName: string;
  fillLevelPct: number;
  totalKg: number;
  recyclablePct: number;
  organicPct: number;
  hazardousPct: number;
  temperature: number;
  lastCollection: string;
  nextCollection: string;
  overflowRisk: number;
  timestamp: string;
}

export interface CarbonMetrics {
  scope1: number;
  scope2: number;
  scope3: number;
  totalCO2: number;
  co2PerKwh: number;
  renewablePct: number;
  carbonOffset: number;
  netCO2: number;
  timestamp: string;
}

export interface SustainabilitySummary {
  totalEnergyKwh: number;
  livePowerDemandKw: number;
  totalWaterL: number;
  totalCO2Kg: number;
  wasteGeneratedKg: number;
  renewablePct: number;
  operationalEfficiency: number;
  sustainabilityScore: number;
  esgComplianceScore: number;
  netZeroProgress: number;
  costSavingsYtd: number;
  carbonReductionYtd: number;
  lastUpdated: string;
}

export interface EnergyPrediction {
  id: string;
  assetId: string;
  assetName: string;
  type: "peak_load" | "energy_waste" | "inefficiency" | "power_failure_risk" | "demand_forecast";
  probability: number;
  predictedValue: number;
  unit: string;
  timeframe: string;
  confidence: number;
  reasoning: string[];
  contributingFactors: string[];
  recommendedAction: string;
  estimatedCostSavings: number;
  estimatedCarbonReduction: number;
  operationalImpact: string;
  timestamp: string;
}

export interface WaterPrediction {
  id: string;
  assetId: string;
  assetName: string;
  type: "demand_forecast" | "leak_probability" | "waste_water" | "maintenance_required";
  probability: number;
  predictedValue: number;
  unit: string;
  timeframe: string;
  confidence: number;
  reasoning: string[];
  contributingFactors: string[];
  recommendedAction: string;
  estimatedCostSavings: number;
  estimatedCarbonReduction: number;
  operationalImpact: string;
  timestamp: string;
}

export interface WastePrediction {
  id: string;
  assetId: string;
  assetName: string;
  type: "overflow_risk" | "collection_schedule" | "generation_forecast" | "recycling_efficiency";
  probability: number;
  predictedValue: number;
  unit: string;
  timeframe: string;
  confidence: number;
  reasoning: string[];
  contributingFactors: string[];
  recommendedAction: string;
  estimatedCostSavings: number;
  estimatedCarbonReduction: number;
  operationalImpact: string;
  timestamp: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: "energy" | "water" | "waste" | "carbon" | "operations";
  priority: "p0" | "p1" | "p2" | "p3";
  status: "active" | "implemented" | "dismissed" | "in_review";
  domain: string;
  assetId: string;
  assetName: string;
  estimatedSavingsKwh: number;
  estimatedWaterSavingsL: number;
  estimatedCostSavings: number;
  estimatedCarbonReduction: number;
  implementationCost: number;
  roi: number;
  paybackDays: number;
  reasoning: string[];
  contributingFactors: string[];
  suggestedAction: string;
  automationPossible: boolean;
  timestamp: string;
}

export interface SmartAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  domain: "energy" | "water" | "waste" | "carbon" | "operations";
  assetId: string;
  assetName: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  aiSuggestion: string;
  requiresAction: boolean;
  createdAt: string;
}

export interface SimulationScenario {
  id: SimulationScenarioId;
  title: string;
  description: string;
  category: "weather" | "failure" | "operations";
  impactMetrics: {
    energyIncreasePct: number;
    waterIncreasePct: number;
    wasteIncreasePct: number;
    carbonIncreasePct: number;
    costImpact: number;
  };
  mitigationStrategies: string[];
}

export interface SimulationResult {
  id: string;
  scenarioId: SimulationScenarioId;
  scenarioTitle: string;
  predictedEnergyKwh: number;
  predictedWaterL: number;
  predictedWasteKg: number;
  predictedCO2Kg: number;
  predictedCost: number;
  mitigatedEnergyKwh: number;
  mitigatedWaterL: number;
  mitigatedWasteKg: number;
  mitigatedCO2Kg: number;
  mitigatedCost: number;
  energySavingsPct: number;
  waterSavingsPct: number;
  carbonSavingsPct: number;
  costSavings: number;
  recommendedActions: string[];
  aiStrategies: { action: string; impact: string; confidence: number }[];
  timestamp: string;
}

export interface TrendDataPoint {
  date: string;
  energyKwh: number;
  waterL: number;
  wasteKg: number;
  co2Kg: number;
  renewablePct: number;
  cost: number;
  efficiency: number;
}

export interface ESGKPI {
  category: string;
  metric: string;
  value: number;
  target: number;
  unit: string;
  status: "on_track" | "at_risk" | "behind" | "achieved";
  trend: "improving" | "stable" | "declining";
}

export interface ExecutiveReport {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  summary: SustainabilitySummary;
  energyKpis: { metric: string; value: number; change: number; unit: string }[];
  waterKpis: { metric: string; value: number; change: number; unit: string }[];
  wasteKpis: { metric: string; value: number; change: number; unit: string }[];
  carbonKpis: { metric: string; value: number; change: number; unit: string }[];
  esgScorecard: ESGKPI[];
  topRecommendations: AIRecommendation[];
  forecast: {
    nextMonthEnergy: number;
    nextMonthWater: number;
    nextMonthWaste: number;
    nextMonthCarbon: number;
    netZeroProjectedDate: string;
  };
}

export interface SustainabilityState {
  summary: SustainabilitySummary | null;
  energyMetrics: EnergyMetrics[];
  waterMetrics: WaterMetrics[];
  wasteMetrics: WasteMetrics[];
  carbonMetrics: CarbonMetrics | null;
  energyPredictions: EnergyPrediction[];
  waterPredictions: WaterPrediction[];
  wastePredictions: WastePrediction[];
  recommendations: AIRecommendation[];
  alerts: SmartAlert[];
  trends: TrendDataPoint[];
  esgKpis: ESGKPI[];
  simulationResult: SimulationResult | null;
  lastReport: ExecutiveReport | null;
  loading: boolean;
  lastUpdated: string | null;
}
