import 'server-only';

const DEFAULT_FRESH_TTL_MS = 5 * 60 * 1000;
const LIVE_FRESH_TTL_MS = 60 * 1000;
const REFERENCE_FRESH_TTL_MS = 30 * 60 * 1000;
const IDLE_EXPIRY_MS = 30 * 60 * 1000;
const HARD_EXPIRY_MS = 2 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;
const MAX_TOTAL_BYTES = 64 * 1024 * 1024;

export const PRIVATE_BFF_CACHE_MAX_BODY_BYTES = 2 * 1024 * 1024;

export type PrivateBffCacheEntry = {
  body: string;
  byteSize: number;
  createdAt: number;
  expiresAt: number;
  freshUntil: number;
  headers: [string, string][];
  key: string;
  lastAccessedAt: number;
  status: number;
  url: string;
  userId: string;
};

type CacheLookup =
  | { state: 'miss'; entry?: never }
  | { state: 'fresh' | 'stale'; entry: PrivateBffCacheEntry };

type StoreCacheOptions = {
  body: string;
  headers: Headers;
  key: string;
  status: number;
  ttlMs: number;
  url: string;
  userId: string;
};

const cache = new Map<string, PrivateBffCacheEntry>();
const refreshes = new Map<string, Promise<void>>();
const textEncoder = new TextEncoder();

let totalBytes = 0;

const LIVE_PATH_PATTERNS = [
  '/attendance',
  '/bookings',
  '/cart',
  '/enrollment',
  '/enrollments',
  '/notifications',
  '/schedule',
  '/timetable',
  '/wallet',
];

const REFERENCE_PATH_PATTERNS = [
  '/catalogue',
  '/categories',
  '/category',
  '/currencies',
  '/currency',
  '/difficulty',
  '/levels',
];

const PRIVATE_HEADER_BLOCKLIST = new Set([
  'content-encoding',
  'content-length',
  'set-cookie',
]);

function byteLength(value: string) {
  return textEncoder.encode(value).byteLength;
}

function deleteEntry(key: string) {
  const entry = cache.get(key);
  if (!entry) {
    return;
  }

  totalBytes -= entry.byteSize;
  cache.delete(key);
}

function pruneExpired(now = Date.now()) {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now || entry.lastAccessedAt + IDLE_EXPIRY_MS <= now) {
      deleteEntry(key);
    }
  }
}

function evictIfNeeded() {
  while (cache.size > MAX_ENTRIES || totalBytes > MAX_TOTAL_BYTES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) {
      return;
    }

    deleteEntry(oldestKey);
  }
}

function serializeHeaders(headers: Headers): [string, string][] {
  return Array.from(headers.entries()).filter(
    ([name]) => !PRIVATE_HEADER_BLOCKLIST.has(name.toLowerCase())
  );
}

export function buildPrivateBffCacheKey(userId: string, upstreamUrl: URL) {
  return `${userId}:GET:${upstreamUrl.pathname}${upstreamUrl.search}`;
}

export function getPrivateBffCacheTtlMs(upstreamUrl: URL) {
  const pathname = upstreamUrl.pathname.toLowerCase();

  if (LIVE_PATH_PATTERNS.some(pattern => pathname.includes(pattern))) {
    return LIVE_FRESH_TTL_MS;
  }

  if (REFERENCE_PATH_PATTERNS.some(pattern => pathname.includes(pattern))) {
    return REFERENCE_FRESH_TTL_MS;
  }

  return DEFAULT_FRESH_TTL_MS;
}

export function getPrivateBffCacheEntry(key: string): CacheLookup {
  const now = Date.now();
  pruneExpired(now);

  const entry = cache.get(key);
  if (!entry) {
    return { state: 'miss' };
  }

  entry.lastAccessedAt = now;
  cache.delete(key);
  cache.set(key, entry);

  return {
    state: entry.freshUntil >= now ? 'fresh' : 'stale',
    entry,
  };
}

export function storePrivateBffCacheEntry(options: StoreCacheOptions) {
  const bodyBytes = byteLength(options.body);
  if (bodyBytes > PRIVATE_BFF_CACHE_MAX_BODY_BYTES) {
    return false;
  }

  const now = Date.now();
  deleteEntry(options.key);

  cache.set(options.key, {
    body: options.body,
    byteSize: bodyBytes,
    createdAt: now,
    expiresAt: now + HARD_EXPIRY_MS,
    freshUntil: now + options.ttlMs,
    headers: serializeHeaders(options.headers),
    key: options.key,
    lastAccessedAt: now,
    status: options.status,
    url: options.url,
    userId: options.userId,
  });

  totalBytes += bodyBytes;
  evictIfNeeded();

  return true;
}

export function deletePrivateBffCacheEntry(key: string) {
  deleteEntry(key);
}

export function clearPrivateBffCacheForUser(userId: string) {
  for (const [key, entry] of cache) {
    if (entry.userId === userId) {
      deleteEntry(key);
    }
  }
}

export function refreshPrivateBffCacheEntry(key: string, refresh: () => Promise<void>) {
  if (refreshes.has(key)) {
    return;
  }

  const task = refresh()
    .catch(() => undefined)
    .finally(() => {
      refreshes.delete(key);
    });

  refreshes.set(key, task);
}
