export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
  reason?: "SOURCE_LIMIT" | "ACCOUNT_LIMIT" | "GLOBAL_LIMIT";
}

export interface RateLimitStore {
  consume(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult>;
  recordFailure(key: string, baseWindowMs: number): Promise<number>;
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
    // Progressive backoff: starting at failure 5, scale lockout exponentially
    if (entry.consecutiveFailures >= 5) {
      const backoffMultiplier = Math.min(entry.consecutiveFailures - 4, 6); // max 2^6 scaling
      const blockDurationMs = baseWindowMs * Math.pow(1.5, backoffMultiplier);
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

// Singleton in-memory rate limit store (Upstash Redis adapter swap in production)
const rateLimitStore: RateLimitStore = new InMemoryRateLimitStore();

export const AUTH_RATE_LIMIT = {
  PER_SOURCE_MAX_ATTEMPTS: 5,
  PER_SOURCE_WINDOW_MS: 15 * 60 * 1000, // 15 minutes

  // Identity / account-level rate limit (prevents botnet rotating IPs against single account)
  PER_ACCOUNT_MAX_ATTEMPTS: 10,
  PER_ACCOUNT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes

  // Global circuit breaker (stops massive distributed attacks)
  GLOBAL_FAILURE_THRESHOLD: 25,
  GLOBAL_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
};

const GLOBAL_AUTH_FAILURE_KEY = "global:auth:failures";

/**
 * Truly layered authentication rate limiting:
 * 1. Global failure circuit check (protects against distributed botnets)
 * 2. Source IP / key quota (5 per 15 min + progressive backoff)
 * 3. Identity / account-level quota (10 per 15 min across all IPs combined)
 */
export async function checkAuthRateLimit(
  sourceKey: string,
  accountTarget?: string
): Promise<RateLimitResult> {
  const normalizedSourceKey = `auth:source:${sourceKey.trim() || "unknown"}`;

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
      reason: "GLOBAL_LIMIT",
    };
  }

  // 2. Source IP quota check
  const sourceCheck = await rateLimitStore.consume(
    normalizedSourceKey,
    AUTH_RATE_LIMIT.PER_SOURCE_MAX_ATTEMPTS,
    AUTH_RATE_LIMIT.PER_SOURCE_WINDOW_MS
  );

  if (!sourceCheck.allowed) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: sourceCheck.retryAfterSeconds || 60,
      reason: "SOURCE_LIMIT",
    };
  }

  // 3. Identity / account quota check (if account is targeted or inferred)
  if (accountTarget) {
    const normalizedAccountKey = `auth:account:${accountTarget.toLowerCase().trim()}`;
    const accountCheck = await rateLimitStore.consume(
      normalizedAccountKey,
      AUTH_RATE_LIMIT.PER_ACCOUNT_MAX_ATTEMPTS,
      AUTH_RATE_LIMIT.PER_ACCOUNT_WINDOW_MS
    );

    if (!accountCheck.allowed) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: accountCheck.retryAfterSeconds || 60,
        reason: "ACCOUNT_LIMIT",
      };
    }
  }

  return {
    allowed: true,
    remaining: sourceCheck.remaining,
  };
}

export async function recordAuthFailure(
  sourceKey: string,
  accountTarget?: string
): Promise<void> {
  const normalizedSourceKey = `auth:source:${sourceKey.trim() || "unknown"}`;
  const operations: Promise<unknown>[] = [
    rateLimitStore.recordFailure(normalizedSourceKey, AUTH_RATE_LIMIT.PER_SOURCE_WINDOW_MS),
    rateLimitStore.recordFailure(GLOBAL_AUTH_FAILURE_KEY, AUTH_RATE_LIMIT.GLOBAL_WINDOW_MS),
  ];

  if (accountTarget) {
    const normalizedAccountKey = `auth:account:${accountTarget.toLowerCase().trim()}`;
    operations.push(
      rateLimitStore.recordFailure(normalizedAccountKey, AUTH_RATE_LIMIT.PER_ACCOUNT_WINDOW_MS)
    );
  }

  await Promise.all(operations);
}

export async function recordAuthSuccess(
  sourceKey: string,
  accountTarget?: string
): Promise<void> {
  const normalizedSourceKey = `auth:source:${sourceKey.trim() || "unknown"}`;
  const operations: Promise<unknown>[] = [rateLimitStore.reset(normalizedSourceKey)];

  if (accountTarget) {
    const normalizedAccountKey = `auth:account:${accountTarget.toLowerCase().trim()}`;
    operations.push(rateLimitStore.reset(normalizedAccountKey));
  }

  await Promise.all(operations);
}

export function getRateLimitStore(): RateLimitStore {
  return rateLimitStore;
}
