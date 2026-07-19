// @ts-nocheck
import type { EnergyAsset, WaterAsset, WasteAsset, SimulationScenario } from "./types";

export const ENERGY_ASSETS: EnergyAsset[] = [
  { id: "hvac-north", name: "North Stand HVAC", type: "hvac", zone: "north_stand", location: "North Stand Level 2", ratedPowerKw: 450, criticality: "critical", source: "grid" },
  { id: "hvac-south", name: "South Stand HVAC", type: "hvac", zone: "south_stand", location: "South Stand Level 2", ratedPowerKw: 450, criticality: "critical", source: "grid" },
  { id: "hvac-east", name: "East Stand HVAC", type: "hvac", zone: "east_stand", location: "East Stand Level 1", ratedPowerKw: 350, criticality: "high", source: "grid" },
  { id: "hvac-west", name: "West Stand HVAC", type: "hvac", zone: "west_stand", location: "West Stand Level 1", ratedPowerKw: 350, criticality: "high", source: "grid" },
  { id: "hvac-vip", name: "VIP HVAC Unit", type: "hvac", zone: "vip_lounge", location: "VIP Lounge Roof", ratedPowerKw: 120, criticality: "high", source: "grid" },
  { id: "light-main", name: "Main Concourse Lighting", type: "lighting", zone: "main_concourse", location: "Concourse Ceiling", ratedPowerKw: 85, criticality: "high", source: "grid" },
  { id: "light-pitch", name: "Pitch Lighting Array", type: "lighting", zone: "north_stand", location: "North Stand Roof", ratedPowerKw: 250, criticality: "critical", source: "grid" },
  { id: "light-vip", name: "VIP Lounge Lighting", type: "lighting", zone: "vip_lounge", location: "VIP Lounge", ratedPowerKw: 30, criticality: "medium", source: "grid" },
  { id: "light-parking", name: "Parking Lighting", type: "lighting", zone: "parking", location: "Parking Levels", ratedPowerKw: 45, criticality: "low", source: "solar" },
  { id: "sb-main", name: "Main Scoreboard", type: "scoreboard", zone: "north_stand", location: "North Stand Face", ratedPowerKw: 180, criticality: "critical", source: "grid" },
  { id: "vw-east", name: "East Video Wall", type: "video_wall", zone: "east_stand", location: "East Stand Concourse", ratedPowerKw: 95, criticality: "medium", source: "grid" },
  { id: "vw-west", name: "West Video Wall", type: "video_wall", zone: "west_stand", location: "West Stand Concourse", ratedPowerKw: 95, criticality: "medium", source: "grid" },
  { id: "kitch-main", name: "Main Kitchen", type: "kitchen", zone: "main_concourse", location: "Concourse Level 1", ratedPowerKw: 220, criticality: "high", source: "grid" },
  { id: "kitch-vip", name: "VIP Kitchen", type: "kitchen", zone: "vip_lounge", location: "VIP Lounge", ratedPowerKw: 80, criticality: "medium", source: "grid" },
  { id: "ev-bank1", name: "EV Charger Bank 1", type: "ev_charger", zone: "parking", location: "Parking Level 1", ratedPowerKw: 350, criticality: "low", source: "grid" },
  { id: "ev-bank2", name: "EV Charger Bank 2", type: "ev_charger", zone: "parking", location: "Parking Level 2", ratedPowerKw: 350, criticality: "low", source: "solar" },
  { id: "net-core", name: "Core Network Switch", type: "networking", zone: "basement", location: "Basement Rack A", ratedPowerKw: 25, criticality: "critical", source: "grid" },
  { id: "net-wifi", name: "WiFi Controller & APs", type: "networking", zone: "basement", location: "Basement Rack B", ratedPowerKw: 18, criticality: "high", source: "grid" },
  { id: "sec-cctv", name: "CCTV System", type: "security", zone: "basement", location: "Security Room", ratedPowerKw: 22, criticality: "high", source: "grid" },
  { id: "sec-access", name: "Access Control System", type: "security", zone: "basement", location: "Security Room", ratedPowerKw: 12, criticality: "high", source: "grid" },
  { id: "gen-a", name: "Backup Generator A", type: "generator", zone: "basement", location: "Basement Room G1", ratedPowerKw: 2000, criticality: "critical", source: "generator" },
  { id: "gen-b", name: "Backup Generator B", type: "generator", zone: "basement", location: "Basement Room G2", ratedPowerKw: 2000, criticality: "critical", source: "generator" },
  { id: "pwr-main", name: "Main Power Distribution", type: "power_distribution", zone: "basement", location: "Basement Room B1", ratedPowerKw: 5000, criticality: "critical", source: "grid" },
  { id: "pwr-sub", name: "Substation A", type: "power_distribution", zone: "basement", location: "Basement Room B2", ratedPowerKw: 3000, criticality: "critical", source: "grid" },
  { id: "solar-roof", name: "Roof Solar Array", type: "solar_panel", zone: "roof", location: "Main Roof", ratedPowerKw: 800, criticality: "medium", source: "solar" },
  { id: "solar-east", name: "East Solar Array", type: "solar_panel", zone: "roof", location: "East Roof Section", ratedPowerKw: 400, criticality: "medium", source: "solar" },
  { id: "solar-west", name: "West Solar Array", type: "solar_panel", zone: "roof", location: "West Roof Section", ratedPowerKw: 400, criticality: "medium", source: "solar" },
  { id: "batt-main", name: "Main Battery Storage", type: "battery_storage", zone: "basement", location: "Basement Room B3", ratedPowerKw: 1500, criticality: "high", source: "battery" },
  { id: "batt-aux", name: "Auxiliary Battery", type: "battery_storage", zone: "basement", location: "Basement Room B4", ratedPowerKw: 500, criticality: "medium", source: "battery" },
];

export const WATER_ASSETS: WaterAsset[] = [
  { id: "rest-north", name: "North Stand Restrooms", type: "restroom", zone: "north_stand", location: "North Stand Level 1-3", capacityLiters: 5000, criticality: "high" },
  { id: "rest-south", name: "South Stand Restrooms", type: "restroom", zone: "south_stand", location: "South Stand Level 1-3", capacityLiters: 5000, criticality: "high" },
  { id: "rest-east", name: "East Stand Restrooms", type: "restroom", zone: "east_stand", location: "East Stand Level 1", capacityLiters: 3000, criticality: "medium" },
  { id: "rest-west", name: "West Stand Restrooms", type: "restroom", zone: "west_stand", location: "West Stand Level 1", capacityLiters: 3000, criticality: "medium" },
  { id: "rest-vip", name: "VIP Restrooms", type: "restroom", zone: "vip_lounge", location: "VIP Lounge", capacityLiters: 1000, criticality: "high" },
  { id: "irr-field", name: "Pitch Irrigation", type: "irrigation", zone: "north_stand", location: "Playing Field", capacityLiters: 20000, criticality: "high" },
  { id: "irr-landscape", name: "Landscape Irrigation", type: "irrigation", zone: "perimeter", location: "Perimeter Gardens", capacityLiters: 8000, criticality: "low" },
  { id: "cool-main", name: "Main Cooling Tower", type: "cooling_tower", zone: "roof", location: "Roof Plant Room", capacityLiters: 15000, criticality: "critical" },
  { id: "cool-hvac", name: "HVAC Cooling Loop", type: "cooling_tower", zone: "basement", location: "Basement HVAC Room", capacityLiters: 10000, criticality: "critical" },
  { id: "clean-main", name: "Concourse Cleaning Station", type: "cleaning", zone: "main_concourse", location: "Concourse Level 1", capacityLiters: 2000, criticality: "low" },
  { id: "fc-north", name: "North Food Court", type: "food_court", zone: "north_stand", location: "North Stand Concourse", capacityLiters: 4000, criticality: "medium" },
  { id: "fc-south", name: "South Food Court", type: "food_court", zone: "south_stand", location: "South Stand Concourse", capacityLiters: 4000, criticality: "medium" },
  { id: "fc-vip", name: "VIP Food Court", type: "food_court", zone: "vip_lounge", location: "VIP Lounge", capacityLiters: 2000, criticality: "medium" },
  { id: "tank-main", name: "Main Storage Tank", type: "storage_tank", zone: "basement", location: "Basement Tank Room", capacityLiters: 100000, criticality: "critical" },
  { id: "tank-rain", name: "Rainwater Harvesting Tank", type: "storage_tank", zone: "basement", location: "Basement Tank Room 2", capacityLiters: 50000, criticality: "medium" },
  { id: "pump-main", name: "Main Water Pump", type: "pump", zone: "basement", location: "Basement Pump Room", capacityLiters: 30000, criticality: "critical" },
  { id: "pump-irr", name: "Irrigation Pump", type: "pump", zone: "basement", location: "Basement Pump Room 2", capacityLiters: 10000, criticality: "high" },
  { id: "pipe-main", name: "Main Supply Pipe", type: "pipe", zone: "basement", location: "Basement Main Line", capacityLiters: 50000, criticality: "critical" },
];

export const WASTE_ASSETS: WasteAsset[] = [
  { id: "waste-food-1", name: "North Concourse Food Waste", type: "food_waste", zone: "north_stand", location: "North Stand Kitchen", capacityKg: 500, collectionSchedule: "daily" },
  { id: "waste-food-2", name: "South Concourse Food Waste", type: "food_waste", zone: "south_stand", location: "South Stand Kitchen", capacityKg: 500, collectionSchedule: "daily" },
  { id: "waste-food-3", name: "VIP Kitchen Food Waste", type: "food_waste", zone: "vip_lounge", location: "VIP Kitchen", capacityKg: 200, collectionSchedule: "daily" },
  { id: "waste-plastic-1", name: "North Stand Plastic Recycling", type: "plastic", zone: "north_stand", location: "North Stand Level 1", capacityKg: 300, collectionSchedule: "weekly" },
  { id: "waste-plastic-2", name: "South Stand Plastic Recycling", type: "plastic", zone: "south_stand", location: "South Stand Level 1", capacityKg: 300, collectionSchedule: "weekly" },
  { id: "waste-paper-1", name: "Main Concourse Paper", type: "paper", zone: "main_concourse", location: "Concourse Level 1", capacityKg: 200, collectionSchedule: "weekly" },
  { id: "waste-paper-2", name: "VIP Lounge Paper", type: "paper", zone: "vip_lounge", location: "VIP Lounge", capacityKg: 100, collectionSchedule: "weekly" },
  { id: "waste-recyclable-1", name: "North Stand Recyclables", type: "recyclable", zone: "north_stand", location: "North Stand Level 1", capacityKg: 400, collectionSchedule: "weekly" },
  { id: "waste-recyclable-2", name: "South Stand Recyclables", type: "recyclable", zone: "south_stand", location: "South Stand Level 1", capacityKg: 400, collectionSchedule: "weekly" },
  { id: "waste-organic-1", name: "Compost Collection North", type: "organic", zone: "north_stand", location: "North Stand Loading Bay", capacityKg: 300, collectionSchedule: "weekly" },
  { id: "waste-organic-2", name: "Compost Collection South", type: "organic", zone: "south_stand", location: "South Stand Loading Bay", capacityKg: 300, collectionSchedule: "weekly" },
  { id: "waste-haz-1", name: "Hazardous Waste Storage", type: "hazardous", zone: "basement", location: "Basement Hazmat Room", capacityKg: 100, collectionSchedule: "monthly" },
];

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  { id: "heatwave", title: "Extreme Heat Wave", description: "Sustained 42°C+ temperatures for 5 consecutive days", category: "weather", impactMetrics: { energyIncreasePct: 65, waterIncreasePct: 45, wasteIncreasePct: 10, carbonIncreasePct: 55, costImpact: 85000 }, mitigationStrategies: ["Shift HVAC load to off-peak", "Activate thermal storage", "Dim non-critical lighting", "Increase solar utilization", "Implement demand response"] },
  { id: "power_outage", title: "Extended Grid Power Outage", description: "Grid power lost for >4 hours during an event", category: "failure", impactMetrics: { energyIncreasePct: 15, waterIncreasePct: 5, wasteIncreasePct: 5, carbonIncreasePct: 80, costImpact: 120000 }, mitigationStrategies: ["Deploy battery storage", "Activate generators selectively", "Critical load shedding", "Optimize generator runtime", "Solar+battery island mode"] },
  { id: "heavy_rain", title: "Heavy Rain & Flooding", description: "100mm+ rainfall in 24 hours with flood risk", category: "weather", impactMetrics: { energyIncreasePct: 8, waterIncreasePct: -15, wasteIncreasePct: 20, carbonIncreasePct: 5, costImpact: 45000 }, mitigationStrategies: ["Activate rainwater harvesting", "Reduce irrigation", "Inspect drainage systems", "Secure waste bins", "Deploy flood barriers"] },
  { id: "water_shortage", title: "Water Supply Shortage", description: "Municipal water supply reduced by 40% for 1 week", category: "weather", impactMetrics: { energyIncreasePct: 5, waterIncreasePct: -30, wasteIncreasePct: 5, carbonIncreasePct: 3, costImpact: 60000 }, mitigationStrategies: ["Activate rainwater reserves", "Restrict non-essential water use", "Optimize cooling tower cycles", "Reduce irrigation schedule", "Deploy water-efficient fixtures"] },
  { id: "solar_failure", title: "Solar Array Failure", description: "Roof solar array output drops to 20% capacity", category: "failure", impactMetrics: { energyIncreasePct: 18, waterIncreasePct: 2, wasteIncreasePct: 2, carbonIncreasePct: 25, costImpact: 35000 }, mitigationStrategies: ["Increase grid draw during off-peak", "Deploy battery storage for peak", "Activate demand response", "Prioritize renewable credits", "Schedule solar repair"] },
  { id: "generator_failure", title: "Backup Generator Failure", description: "Both generators offline during grid instability", category: "failure", impactMetrics: { energyIncreasePct: 5, waterIncreasePct: 3, wasteIncreasePct: 2, carbonIncreasePct: 5, costImpact: 95000 }, mitigationStrategies: ["Maximize battery discharge", "Critical load prioritization", "Activate demand-side management", "Coordinate with grid operator", "Emergency load shed plan"] },
  { id: "peak_match_day", title: "Peak Match Day", description: "Full stadium capacity with premium event demands", category: "operations", impactMetrics: { energyIncreasePct: 120, waterIncreasePct: 200, wasteIncreasePct: 300, carbonIncreasePct: 110, costImpact: 25000 }, mitigationStrategies: ["Pre-cool stadium before peak", "Stagger kitchen operations", "Maximize solar generation", "Deploy battery for peak shaving", "Increase waste collection frequency"] },
  { id: "full_stadium", title: "Full Stadium Capacity Week", description: "4 consecutive events at full capacity", category: "operations", impactMetrics: { energyIncreasePct: 95, waterIncreasePct: 180, wasteIncreasePct: 280, carbonIncreasePct: 90, costImpact: 95000 }, mitigationStrategies: ["Optimize all schedules for efficiency", "Deploy full solar+battery capacity", "Increase water storage reserves", "Double waste collection frequency", "Implement real-time load balancing"] },
];

export const ALERT_THRESHOLDS = {
  POWER_SPIKE_PCT: 25,
  WATER_LEAK_FLOW_DELTA: 50,
  HIGH_CARBON_CO2_KG: 500,
  ENERGY_WASTE_PCT: 15,
  WASTE_OVERFLOW_PCT: 85,
  GENERATOR_EFFICIENCY_MIN: 60,
  COOLING_EFFICIENCY_MIN: 65,
  WATER_DEMAND_PEAK_PCT: 80,
  SOLAR_DROP_PCT: 40,
  BATTERY_DEGRADATION_PCT: 20,
  EMISSION_BREACH_CO2_KG: 1000,
};

export const SUSTAINABILITY_TARGETS = {
  renewablePctTarget: 50,
  carbonNeutralYear: 2035,
  waterNeutralYear: 2030,
  zeroWasteYear: 2030,
  efficiencyMinTarget: 75,
  sustainabilityScoreTarget: 85,
  esgComplianceTarget: 80,
  netZeroProgressTarget: 100,
};

export const CARBON_FACTORS = {
  gridElectricityKgCO2PerKwh: 0.425,
  solarKgCO2PerKwh: 0.05,
  generatorKgCO2PerKwh: 0.85,
  waterKgCO2PerLiter: 0.0003,
  wasteKgCO2PerKg: 0.5,
  recyclingKgCO2PerKg: 0.1,
  compostingKgCO2PerKg: 0.05,
};

export const UTILITY_RATES = {
  electricityCostPerKwh: 0.12,
  waterCostPerLiter: 0.002,
  wasteDisposalCostPerKg: 0.15,
  recyclingRevenuePerKg: 0.05,
  solarIncentivePerKwh: 0.04,
};

