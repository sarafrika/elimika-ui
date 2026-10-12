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
  family: string;
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

/**
 * Admin decision queues must never be answered from another admin's cache: two admins
 * working the same inbox would see each other's cleared items linger. These paths are
 * always fetched fresh.
 */
const NO_CACHE_PATH_PATTERNS = [
  '/admin/courses/pending',
  '/admin/dashboard/activity-feed',
  '/admin/dashboard/statistics',
  '/admin/organisations/pending',
  '/admin/programs/pending',
  '/admin/review-queue',
  '/documents/search',
  '/verification-status',
];

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

/** Reference families no user write elsewhere can change; only their own writes (or admin) clear them. */
const REFERENCE_FAMILIES = new Set([
  'academic-tiers',
  'age-groups',
  'config',
  'currencies',
  'document-types',
  'skills',
  'system-rules',
]);

/** Writes whose effect stays inside their own family, so the rest of the user's cache survives. */
const SELF_CONTAINED_WRITE_FAMILIES = new Set(['notifications']);

/** POSTs that only compute an answer and change nothing upstream. */
const READ_ONLY_WRITE_PATTERNS = ['/check-conflict'];

const PRIVATE_HEADER_BLOCKLIST = new Set(['content-encoding', 'content-length', 'set-cookie']);

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

/**
 * @param actingDomain the dashboard the call was made from, or null when it
 *   carried none. Part of the key because the same user asking the same URL from
 *   two dashboards is now entitled to two different answers — without it the
 *   admin dashboard's full course content would be replayed from this cache onto
 *   the student dashboard, undoing server-side capping in the one hop after it.
 */
export function buildPrivateBffCacheKey(
  userId: string,
  upstreamUrl: URL,
  actingDomain: string | null = null
) {
  return `${userId}:GET:${actingDomain ?? '-'}:${upstreamUrl.pathname}${upstreamUrl.search}`;
}

/** First resource segment after the API version, e.g. `courses` for /api/v1/courses/{uuid}. */
export function getPrivateBffCacheFamily(upstreamUrl: URL) {
  const segments = upstreamUrl.pathname.toLowerCase().split('/').filter(Boolean);
  const versionIndex = segments.findIndex(segment => /^v\d+$/.test(segment));
  return segments[versionIndex + 1] ?? segments[0] ?? '';
}

/** True when a response must not be served from this cache at all. */
export function isPrivateBffCacheBypassed(upstreamUrl: URL) {
  const pathname = upstreamUrl.pathname.toLowerCase();
  return NO_CACHE_PATH_PATTERNS.some(pattern => pathname.includes(pattern));
}

export function getPrivateBffCacheTtlMs(upstreamUrl: URL) {
  const pathname = upstreamUrl.pathname.toLowerCase();

  if (isPrivateBffCacheBypassed(upstreamUrl)) {
    return 0;
  }

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
    family: getPrivateBffCacheFamily(new URL(options.url)),
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

/**
 * Drops only the entries a write can have changed: its own family, plus every non-reference
 * family unless the write is self-contained. Admin writes clear everything.
 */
export function invalidatePrivateBffCacheForWrite(userId: string, upstreamUrl: URL) {
  const pathname = upstreamUrl.pathname.toLowerCase();
  if (READ_ONLY_WRITE_PATTERNS.some(pattern => pathname.includes(pattern))) {
    return;
  }

  const family = getPrivateBffCacheFamily(upstreamUrl);
  if (family === 'admin') {
    clearPrivateBffCacheForUser(userId);
    return;
  }

  const selfContained = SELF_CONTAINED_WRITE_FAMILIES.has(family);
  for (const [key, entry] of cache) {
    if (entry.userId !== userId) {
      continue;
    }
    const affected =
      entry.family === family ||
      (!selfContained &&
        !REFERENCE_FAMILIES.has(entry.family) &&
        !SELF_CONTAINED_WRITE_FAMILIES.has(entry.family));
    if (affected) {
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
