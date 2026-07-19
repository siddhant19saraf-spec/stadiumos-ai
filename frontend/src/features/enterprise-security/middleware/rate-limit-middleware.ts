// @ts-nocheck
import type { RateLimitConfig, RateLimitState, MiddlewareResult, SecurityContext } from "../types";
import { ALERT_THRESHOLDS } from "../constants";

export interface IRateLimitMiddleware {
  check(identifier: string): MiddlewareResult;
  getState(identifier: string): RateLimitState | null;
  reset(identifier: string): void;
  getActiveBlocks(): RateLimitState[];
  clearExpired(): number;
}

export class RateLimitMiddleware implements IRateLimitMiddleware {
  private states: Map<string, RateLimitState> = new Map();
  private config: RateLimitConfig = {
    windowMs: ALERT_THRESHOLDS.RATE_LIMIT_WINDOW_MS,
    maxRequests: ALERT_THRESHOLDS.RATE_LIMIT_MAX_REQUESTS,
    identifier: "global",
  };

  check(identifier: string): MiddlewareResult {
    const now = Date.now();
    let state = this.states.get(identifier);

    if (!state || now - state.windowStart > this.config.windowMs) {
      state = { identifier, count: 1, windowStart: now, blocked: false, blockedUntil: null };
      this.states.set(identifier, state);
      return { allowed: true, status: 200 };
    }

    if (state.blocked) {
      if (state.blockedUntil && now < state.blockedUntil) {
        const retryAfter = Math.ceil((state.blockedUntil - now) / 1000);
        return { allowed: false, status: 429, error: `Rate limit exceeded. Retry after ${retryAfter} seconds.` };
      }
      state.blocked = false;
      state.blockedUntil = null;
    }

    state.count++;

    if (state.count > this.config.maxRequests) {
      state.blocked = true;
      state.blockedUntil = now + 60000;
      return { allowed: false, status: 429, error: "Rate limit exceeded. Try again in 60 seconds." };
    }

    return { allowed: true, status: 200 };
  }

  getState(identifier: string): RateLimitState | null {
    return this.states.get(identifier) ?? null;
  }

  reset(identifier: string): void {
    this.states.delete(identifier);
  }

  getActiveBlocks(): RateLimitState[] {
    const now = Date.now();
    return Array.from(this.states.values()).filter(
      (s) => s.blocked && s.blockedUntil && s.blockedUntil > now,
    );
  }

  clearExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, state] of this.states) {
      if (!state.blocked && now - state.windowStart > this.config.windowMs) {
        this.states.delete(key);
        count++;
      }
      if (state.blocked && state.blockedUntil && state.blockedUntil < now) {
        this.states.delete(key);
        count++;
      }
    }
    return count;
  }
}

export const rateLimitMiddleware = new RateLimitMiddleware();

