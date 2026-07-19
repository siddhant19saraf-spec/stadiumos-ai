export const APP_NAME = "StadiumOS AI";
export const APP_VERSION = "0.1.0";
export const API_VERSION = "v1";

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const WEBSOCKET = {
  RECONNECT_DELAY: 3000,
  MAX_RECONNECT_ATTEMPTS: 10,
  PING_INTERVAL: 30000,
} as const;

export const CACHE = {
  STALE_TIME: 30 * 1000,
  GC_TIME: 5 * 60 * 1000,
  PREDICTION_TTL: 5 * 60 * 1000,
} as const;

export const THEME = {
  STORAGE_KEY: "stadiumos-theme",
  DEFAULT: "dark",
} as const;

export { MODULE_CATEGORIES, SIDEBAR_ITEMS } from "./modules";
