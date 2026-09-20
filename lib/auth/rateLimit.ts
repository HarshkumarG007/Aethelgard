export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export interface RateLimitStore {
  consume(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult>;
  recordFailure(key: string, baseWindowMs: number): Promise<number>; // returns consecutive failures
  reset(key: string): Promise<void>;
  clearAll?(): Promise<void>;
}

interface WindowEntry {
  count: number;
  resetTime: number;
  consecutiveFailures: number;
  blockedUntil?: number;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, WindowEntry> = new Map();

  async consume(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry && entry.blockedUntil && entry.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    if (!entry || now > entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
        consecutiveFailures: entry?.consecutiveFailures ?? 0,
      });
      return {
        allowed: true,
        remaining: limit - 1,
      };
    }

    if (entry.count >= limit) {
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      remaining: limit - entry.count,
    };
  }

  async recordFailure(key: string, baseWindowMs: number): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key) || {
      count: 0,
      resetTime: now + baseWindowMs,
      consecutiveFailures: 0,
    };

    entry.consecutiveFailures += 1;
    // Progressive backoff: if 5 or more failures, block with exponential duration
    if (entry.consecutiveFailures >= 5) {
      const backoffFactor = Math.min(entry.consecutiveFailures - 4, 6); // max 2^6 multiplier
      const blockDurationMs = baseWindowMs * Math.pow(1.5, backoffFactor);
      entry.blockedUntil = now + blockDurationMs;
    }

    this.store.set(key, entry);
    return entry.consecutiveFailures;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clearAll(): Promise<void> {
    this.store.clear();
  }
}

// Global store instance
const rateLimitStore: RateLimitStore = new InMemoryRateLimitStore();

export const AUTH_RATE_LIMIT = {
  PER_SOURCE_MAX_ATTEMPTS: 5,
  PER_SOURCE_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GLOBAL_FAILURE_THRESHOLD: 25,
  GLOBAL_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
};

const GLOBAL_AUTH_FAILURE_KEY = "global:auth:failures";

/**
 * Layered rate limit check:
 * 1. Checks source IP / key quota (5 per 15 min + progressive backoff)
 * 2. Checks global failure circuit breaker to resist distributed IP-rotation attacks
 */
export async function checkAuthRateLimit(sourceKey: string): Promise<RateLimitResult> {
  const normalizedKey = `auth:source:${sourceKey.trim() || "unknown"}`;

  // 1. Global failure circuit check
  const globalCheck = await rateLimitStore.consume(
    GLOBAL_AUTH_FAILURE_KEY,
    AUTH_RATE_LIMIT.GLOBAL_FAILURE_THRESHOLD,
    AUTH_RATE_LIMIT.GLOBAL_WINDOW_MS
  );

  if (!globalCheck.allowed) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: globalCheck.retryAfterSeconds || 60,
    };
  }

  // 2. Source key check
  return rateLimitStore.consume(
    normalizedKey,
    AUTH_RATE_LIMIT.PER_SOURCE_MAX_ATTEMPTS,
    AUTH_RATE_LIMIT.PER_SOURCE_WINDOW_MS
  );
}

export async function recordAuthFailure(sourceKey: string): Promise<void> {
  const normalizedKey = `auth:source:${sourceKey.trim() || "unknown"}`;
  await Promise.all([
    rateLimitStore.recordFailure(normalizedKey, AUTH_RATE_LIMIT.PER_SOURCE_WINDOW_MS),
    rateLimitStore.recordFailure(GLOBAL_AUTH_FAILURE_KEY, AUTH_RATE_LIMIT.GLOBAL_WINDOW_MS),
  ]);
}

export async function recordAuthSuccess(sourceKey: string): Promise<void> {
  const normalizedKey = `auth:source:${sourceKey.trim() || "unknown"}`;
  await rateLimitStore.reset(normalizedKey);
}

export function getRateLimitStore(): RateLimitStore {
  return rateLimitStore;
}
