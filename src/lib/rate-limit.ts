import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  UPSTASH_URL && UPSTASH_TOKEN ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }) : null;

let warnedDevFallback = false;

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(prefix: string, config: RateLimitConfig): Ratelimit | null {
  if (!redis) return null;
  const key = `${prefix}:${config.limit}:${config.windowSeconds}`;
  let limiter = limiterCache.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      prefix: `renew-rl:${prefix}`,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      analytics: true,
    });
    limiterCache.set(key, limiter);
  }
  return limiter;
}

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();
let lastCleanup = Date.now();

function memoryCheck(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    for (const [k, v] of memoryStore) {
      if (now > v.resetAt) memoryStore.delete(k);
    }
  }

  const windowMs = config.windowSeconds * 1000;
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: config.limit - 1, resetAt: now + windowMs };
  }

  entry.count++;

  if (entry.count > config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Check rate limit for an identifier (typically IP address).
 *
 * Uses Upstash Redis when configured (production); falls back to per-instance
 * in-memory store when env vars are missing (dev only — production throws on import).
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  prefix = 'default',
): Promise<RateLimitResult> {
  const limiter = getLimiter(prefix, config);
  if (limiter) {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[rate-limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production. ' +
        'In-memory rate limiting is not safe across Netlify function instances.',
    );
  }
  if (!warnedDevFallback) {
    warnedDevFallback = true;
    console.warn(
      '[rate-limit] Upstash env vars missing — falling back to in-memory limiter. ' +
        'Acceptable for local dev only.',
    );
  }
  return memoryCheck(`${prefix}:${identifier}`, config);
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ── Pre-configured limits ──────────────────────────────────────

/** Public vendor portal endpoints: 20 requests per minute per IP */
export const VENDOR_TOKEN_LIMIT: RateLimitConfig = { limit: 20, windowSeconds: 60 };

/**
 * Rate limit helper — returns a 429 NextResponse if exceeded, or null if OK.
 */
export async function rateLimitOrNull(
  request: Request,
  prefix: string,
  config: RateLimitConfig,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(ip, config, prefix);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))) },
      },
    );
  }
  return null;
}
