import type { InventoryItem, MenuItem, QueuePointStatus } from "../types";
import { MENU_ITEMS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export interface IInventoryEngine {
  simulate(menuItems: MenuItem[], queueStatuses: Map<string, QueuePointStatus>): Map<string, InventoryItem>;
  forecastDemand(menuItems: MenuItem[], hour: number): Map<string, number>;
  identifyShortages(inventory: Map<string, InventoryItem>): InventoryItem[];
}

export class MockInventoryEngine implements IInventoryEngine {
  private tick = 0;

  simulate(menuItems: MenuItem[], queueStatuses: Map<string, QueuePointStatus>): Map<string, InventoryItem> {
    this.tick++;
    const inventory = new Map<string, InventoryItem>();
    const hour = new Date().getHours();
    const demandMultiplier = this.demandMultiplier(hour);

    for (const item of menuItems) {
      const prev = inventory.get(item.id);
      const maxStock = this.maxStock(item);
      const dailyDemand = Math.round(item.popularity * 200 * demandMultiplier);
      const consumption = Math.round(dailyDemand * 0.15 * (this.tick % 20 + 1) / 20 + rand(-5, 5));
      const currentStock = prev ? Math.max(0, prev.currentStock - consumption) : Math.round(maxStock * 0.7 + randf(-5, 5, 0));
      const reorderPoint = Math.round(maxStock * 0.25);
      const wastePct = item.category === "food" ? randf(3, 8, 0) : item.category === "beverage" ? randf(2, 5, 0) : randf(1, 3, 0);
      const shortageIn = currentStock < reorderPoint ? Math.round(currentStock / Math.max(1, dailyDemand / 1440) / 60) : null;

      inventory.set(item.id, {
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: Math.max(0, currentStock),
        maxStock,
        reorderPoint,
        dailyDemand,
        wastePercent: wastePct,
        predictedShortageInMin: shortageIn,
        restockPriority: currentStock <= reorderPoint * 0.5 ? "critical" : currentStock <= reorderPoint ? "high" : currentStock <= reorderPoint * 1.5 ? "medium" : "low",
        lastRestocked: new Date().toISOString(),
      });
    }

    return inventory;
  }

  forecastDemand(menuItems: MenuItem[], hour: number): Map<string, number> {
    const forecast = new Map<string, number>();
    const multiplier = this.demandMultiplier(hour);
    for (const item of menuItems) {
      forecast.set(item.id, Math.round(item.popularity * 150 * multiplier * randf(0.9, 1.1, 1)));
    }
    return forecast;
  }

  identifyShortages(inventory: Map<string, InventoryItem>): InventoryItem[] {
    return Array.from(inventory.values())
      .filter((item) => item.restockPriority === "critical" || item.restockPriority === "high")
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.restockPriority] ?? 4) - (order[b.restockPriority] ?? 4);
      });
  }

  private maxStock(item: MenuItem): number {
    const bases: Record<string, number> = {
      food: 500, beverage: 800, merchandise: 200, other: 300,
    };
    return Math.round((bases[item.category] ?? 300) * item.popularity);
  }

  private demandMultiplier(hour: number): number {
    if (hour >= 11 && hour <= 13) return 2.0;
    if (hour >= 17 && hour <= 20) return 2.2;
    if (hour >= 7 && hour <= 9) return 1.3;
    if (hour >= 21 && hour <= 23) return 1.0;
    return 0.6;
  }
}

export const inventoryEngine = new MockInventoryEngine();
