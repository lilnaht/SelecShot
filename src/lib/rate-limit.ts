import "server-only";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  namespace?: string;
  now?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 10_000;

export function checkRateLimit({
  key,
  limit,
  windowMs,
  namespace = "default",
  now = Date.now(),
}: RateLimitOptions): RateLimitResult {
  const normalizedLimit = Math.max(1, Math.floor(limit));
  const normalizedWindowMs = Math.max(1_000, Math.floor(windowMs));
  const cacheKey = `${namespace}:${key}`;

  cleanupExpiredBuckets(now);

  const bucket = buckets.get(cacheKey);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + normalizedWindowMs;
    buckets.set(cacheKey, { count: 1, resetAt });

    return {
      allowed: true,
      limit: normalizedLimit,
      remaining: normalizedLimit - 1,
      resetAt,
      retryAfterSeconds: secondsUntil(resetAt, now),
    };
  }

  if (bucket.count >= normalizedLimit) {
    return {
      allowed: false,
      limit: normalizedLimit,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: secondsUntil(bucket.resetAt, now),
    };
  }

  bucket.count += 1;

  return {
    allowed: true,
    limit: normalizedLimit,
    remaining: normalizedLimit - bucket.count,
    resetAt: bucket.resetAt,
    retryAfterSeconds: secondsUntil(bucket.resetAt, now),
  };
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

function secondsUntil(resetAt: number, now: number): number {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

function cleanupExpiredBuckets(now: number): void {
  if (buckets.size < MAX_BUCKETS) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  if (buckets.size < MAX_BUCKETS) {
    return;
  }

  const oldestKeys = Array.from(buckets.entries())
    .sort(([, first], [, second]) => first.resetAt - second.resetAt)
    .slice(0, Math.ceil(MAX_BUCKETS / 10))
    .map(([key]) => key);

  for (const key of oldestKeys) {
    buckets.delete(key);
  }
}
