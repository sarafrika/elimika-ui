export const PUBLIC_FILE_MAX_ENTRY_BYTES = 1024 * 1024;
const PUBLIC_FILE_MAX_TOTAL_BYTES = 48 * 1024 * 1024;
// Files are uuid-named and never rewritten, so a day is safe; a miss is rechecked sooner.
const PUBLIC_FILE_TTL_MS = 24 * 60 * 60 * 1000;
const PUBLIC_FILE_MISSING_TTL_MS = 300 * 1000;
// Charged per entry so empty 404 bodies still count against the byte cap.
const ENTRY_OVERHEAD_BYTES = 1024;

export type PublicFileEntry = {
  status: 200 | 404;
  body: Uint8Array;
  contentType: string | null;
  contentDisposition: string | null;
  etag: string | null;
  lastModified: string | null;
  expiresAt: number;
};

type CacheOptions = { maxTotalBytes?: number; now?: () => number };

/** Only plain whole-file GETs are cached; Range and HEAD always go upstream. */
export function isPublicFileCacheable(method: string, headers: Headers) {
  return method === 'GET' && !headers.has('range') && !headers.has('if-range');
}

export function publicFileCacheKey(upstreamUrl: URL) {
  return `${upstreamUrl.pathname}${upstreamUrl.search}`;
}

function entrySize(entry: PublicFileEntry) {
  return entry.body.byteLength + ENTRY_OVERHEAD_BYTES;
}

/** If-None-Match against a stored etag, honouring lists, weak tags and `*`. */
export function etagMatches(ifNoneMatch: string | null, etag: string | null) {
  if (!ifNoneMatch || !etag) return false;
  const strip = (tag: string) => tag.trim().replace(/^W\//, '');
  const target = strip(etag);
  return ifNoneMatch.split(',').some(tag => tag.trim() === '*' || strip(tag) === target);
}

export function createPublicFileCache({
  maxTotalBytes = PUBLIC_FILE_MAX_TOTAL_BYTES,
  now = Date.now,
}: CacheOptions = {}) {
  const entries = new Map<string, PublicFileEntry>();
  const pending = new Map<string, Promise<PublicFileEntry | null>>();
  let totalBytes = 0;

  const remove = (key: string) => {
    const entry = entries.get(key);
    if (!entry) return;
    entries.delete(key);
    totalBytes -= entrySize(entry);
  };

  const get = (key: string) => {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now()) {
      remove(key);
      return undefined;
    }
    entries.delete(key);
    entries.set(key, entry);
    return entry;
  };

  const set = (key: string, entry: PublicFileEntry) => {
    const size = entrySize(entry);
    if (entry.body.byteLength > PUBLIC_FILE_MAX_ENTRY_BYTES || size > maxTotalBytes) {
      return false;
    }
    remove(key);
    while (totalBytes + size > maxTotalBytes) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      remove(oldest);
    }
    entries.set(key, entry);
    totalBytes += size;
    return true;
  };

  /** Builds a storable entry from an upstream answer, or null when it must stream. */
  const toEntry = async (response: Response): Promise<PublicFileEntry | null> => {
    const headers = response.headers;
    const shared = {
      contentType: headers.get('content-type'),
      contentDisposition: headers.get('content-disposition'),
      etag: headers.get('etag'),
      lastModified: headers.get('last-modified'),
    };
    if (response.status === 404) {
      await response.body?.cancel().catch(() => undefined);
      return {
        ...shared,
        status: 404,
        body: new Uint8Array(),
        contentDisposition: null,
        expiresAt: now() + PUBLIC_FILE_MISSING_TTL_MS,
      };
    }
    const length = Number(headers.get('content-length') ?? Number.NaN);
    if (response.status !== 200 || !Number.isFinite(length) || length > PUBLIC_FILE_MAX_ENTRY_BYTES) {
      return null;
    }
    const body = new Uint8Array(await response.arrayBuffer());
    return { ...shared, status: 200, body, expiresAt: now() + PUBLIC_FILE_TTL_MS };
  };

  /**
   * Cached entry, or one shared upstream fetch per key. `response` is set only when
   * the answer could not be cached and must be streamed by this caller.
   */
  const load = async (
    key: string,
    fetchUpstream: () => Promise<Response>
  ): Promise<{ entry: PublicFileEntry; hit: boolean } | { response: Response }> => {
    const cached = get(key);
    if (cached) return { entry: cached, hit: true };

    const inFlight = pending.get(key);
    if (inFlight) {
      const shared = await inFlight;
      return shared ? { entry: shared, hit: false } : { response: await fetchUpstream() };
    }

    let settle: (entry: PublicFileEntry | null) => void = () => undefined;
    pending.set(key, new Promise(resolve => (settle = resolve)));
    try {
      const response = await fetchUpstream();
      const entry = await toEntry(response);
      if (!entry) {
        settle(null);
        return { response };
      }
      set(key, entry);
      settle(entry);
      return { entry, hit: false };
    } catch (error) {
      settle(null);
      throw error;
    } finally {
      pending.delete(key);
    }
  };

  return { get, set, load, size: () => totalBytes, count: () => entries.size };
}

let sharedCache: ReturnType<typeof createPublicFileCache> | undefined;

/** Process-wide cache used by the proxy route. */
export function getPublicFileCache() {
  sharedCache ??= createPublicFileCache();
  return sharedCache;
}
