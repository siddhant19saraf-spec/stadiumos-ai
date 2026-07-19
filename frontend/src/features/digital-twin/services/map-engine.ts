import type { StadiumZone, MapEntity, LayerConfig, LayerId } from "../types";

export interface IMapEngine {
  getVisibleEntities(entities: MapEntity[], enabledLayers: LayerId[]): MapEntity[];
  filterByZone(entities: MapEntity[], zoneId: string): MapEntity[];
  search(query: string, zones: StadiumZone[]): StadiumZone[];
}

export class MockMapEngine implements IMapEngine {
  getVisibleEntities(entities: MapEntity[], enabledLayers: LayerId[]): MapEntity[] {
    return entities.filter((e) => enabledLayers.includes(e.layer));
  }

  filterByZone(entities: MapEntity[], zoneId: string): MapEntity[] {
    return entities.filter((e) => e.zoneId === zoneId);
  }

  search(query: string, zones: StadiumZone[]): StadiumZone[] {
    const q = query.toLowerCase();
    return zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.id.toLowerCase().includes(q) ||
        z.type.toLowerCase().includes(q) ||
        z.section?.toLowerCase().includes(q),
    );
  }
}

export const mapEngine = new MockMapEngine();
