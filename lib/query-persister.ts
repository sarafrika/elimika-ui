import type { Query, QueryClient } from '@tanstack/react-query';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { logger } from '@/lib/logger';
import { deserializeQueryCache, serializeQueryCache } from '@/lib/query-cache-serializer';
import { MAX_PERSISTED_CHARS, MAX_PERSISTED_QUERIES } from '@/lib/query-client';
import { isVolatileGeneratedQuery } from '@/src/features/dashboard/workflow-query-invalidation';

type PersistStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type DehydratedQuery = PersistedClient['clientState']['queries'][number];

const QUIET_MS = 300;
const MIN_SAVE_INTERVAL_MS = 3000;
const SLOW_MEASURE_MS = 50;

let reportedDrop = false;

/** The dehydrate filter: only settled, non-volatile answers are worth replaying. */
export function shouldPersistQuery(query: Pick<Query, 'queryKey' | 'state'>): boolean {
  return query.state.status === 'success' && !isVolatileGeneratedQuery(query.queryKey);
}

/** Keeps the newest `maxQueries` persistable queries, newest first. */
export function trimPersistedClient(
  client: PersistedClient,
  maxQueries: number = MAX_PERSISTED_QUERIES
): PersistedClient {
  const queries = client.clientState.queries
    .filter(shouldPersistQuery)
    .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
    .slice(0, maxQueries);
  return { ...client, clientState: { ...client.clientState, queries } };
}

function withQueries(client: PersistedClient, queries: DehydratedQuery[]): PersistedClient {
  return { ...client, clientState: { ...client.clientState, queries } };
}

function timed<T>(name: string, run: () => T): T {
  const canMeasure = typeof performance !== 'undefined' && typeof performance.mark === 'function';
  const start = `${name}:start`;
  if (canMeasure) performance.mark(start);
  try {
    return run();
  } finally {
    if (canMeasure) {
      try {
        const entry = performance.measure(name, start);
        if (entry && entry.duration > SLOW_MEASURE_MS) {
          logger.debug(`${name} took ${Math.round(entry.duration)} ms`);
        }
      } catch {
        // A missing mark only costs the measurement.
      }
      performance.clearMarks(start);
    }
  }
}

function tryWrite(
  storage: PersistStorage,
  key: string,
  client: PersistedClient,
  serialize: (client: PersistedClient) => string,
  maxChars: number
): boolean {
  try {
    const text = serialize(client);
    if (text.length > maxChars) return false;
    storage.setItem(key, text);
    return true;
  } catch {
    return false;
  }
}

/** Serialises at most twice: the trimmed snapshot, then its newest half; else drops the key. */
export function writeSnapshot(
  storage: PersistStorage,
  key: string,
  client: PersistedClient,
  {
    serialize = serializeQueryCache,
    maxChars = MAX_PERSISTED_CHARS,
    maxQueries = MAX_PERSISTED_QUERIES,
  }: {
    serialize?: (client: PersistedClient) => string;
    maxChars?: number;
    maxQueries?: number;
  } = {}
): boolean {
  return timed('elimika:query-persist', () => {
    const trimmed = trimPersistedClient(client, maxQueries);
    if (tryWrite(storage, key, trimmed, serialize, maxChars)) return true;
    const { queries } = trimmed.clientState;
    const half = withQueries(trimmed, queries.slice(0, Math.floor(queries.length / 2)));
    if (tryWrite(storage, key, half, serialize, maxChars)) return true;
    try {
      storage.removeItem(key);
    } catch {
      // Storage is unusable; the next load simply starts cold.
    }
    if (!reportedDrop) {
      reportedDrop = true;
      logger.warn('Query cache snapshot exceeded the storage budget and was dropped');
    }
    return false;
  });
}

type QueryPersisterOptions = {
  queryClient: Pick<QueryClient, 'isFetching' | 'getQueryCache'>;
  key: string;
  storage: PersistStorage | undefined;
  quietMs?: number;
  minIntervalMs?: number;
  serialize?: (client: PersistedClient) => string;
};

/**
 * Saves the latest snapshot only after fetching has been idle for `quietMs`, at most once
 * per `minIntervalMs`, so serialisation never lands in the page-load request window.
 */
export function createQueryPersister({
  queryClient,
  key,
  storage,
  quietMs = QUIET_MS,
  minIntervalMs = MIN_SAVE_INTERVAL_MS,
  serialize = serializeQueryCache,
}: QueryPersisterOptions): Persister {
  let latest: PersistedClient | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastSaveAt = Number.NEGATIVE_INFINITY;
  let subscribed = false;

  const flush = () => {
    timer = undefined;
    if (!latest || !storage) return;
    // A fetch in flight emits a cache event when it settles, which re-arms the timer.
    if (queryClient.isFetching() > 0) return;
    const wait = lastSaveAt + minIntervalMs - Date.now();
    if (wait > 0) {
      timer = setTimeout(flush, wait);
      return;
    }
    const snapshot = latest;
    latest = null;
    lastSaveAt = Date.now();
    writeSnapshot(storage, key, snapshot, { serialize });
  };

  // Every cache event (including a fetch starting) restarts the quiet window.
  const arm = () => {
    if (!latest) return;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(flush, quietMs);
  };

  return {
    persistClient: client => {
      if (!storage) return;
      latest = client;
      if (!subscribed) {
        subscribed = true;
        queryClient.getQueryCache().subscribe(arm);
      }
      arm();
    },
    restoreClient: () => {
      if (!storage) return undefined;
      const text = storage.getItem(key);
      if (!text) return undefined;
      return timed('elimika:query-restore', () => deserializeQueryCache(text));
    },
    removeClient: () => {
      latest = null;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      storage?.removeItem(key);
    },
  };
}
