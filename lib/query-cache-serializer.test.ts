import assert from 'node:assert/strict';
import test from 'node:test';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import {
  isVolatileGeneratedQuery,
  VOLATILE_GENERATED_QUERY_IDS,
} from '@/src/features/dashboard/workflow-query-invalidation';
import { deserializeQueryCache, serializeQueryCache } from './query-cache-serializer';
import { createQueryPersister, trimPersistedClient, writeSnapshot } from './query-persister';

test('nested BigInt and Date values survive a round trip', () => {
  const when = new Date('2026-10-10T08:30:00.000Z');
  const value = {
    metadata: { totalElements: BigInt('9007199254740993'), negative: BigInt(-4) },
    items: [{ created_date: when, count: BigInt(3) }, null, [BigInt(1), 'x']],
    invalid: new Date('not a date'),
    nothing: null,
    plain: { $date: '2026-01-01T00:00:00.000Z', other: 1 },
    lookalike: { $bigint: 'abc' },
  };
  const restored = deserializeQueryCache(serializeQueryCache(value)) as unknown as typeof value;

  assert.equal(restored.metadata.totalElements, BigInt('9007199254740993'));
  assert.equal(restored.metadata.negative, BigInt(-4));
  assert.ok(
    restored.items[0] && (restored.items[0] as { created_date: Date }).created_date instanceof Date
  );
  assert.equal(
    (restored.items[0] as { created_date: Date }).created_date.getTime(),
    when.getTime()
  );
  assert.equal((restored.items[0] as { count: bigint }).count, BigInt(3));
  assert.equal(restored.items[1], null);
  assert.deepEqual(restored.items[2], [BigInt(1), 'x']);
  assert.equal(restored.invalid, null);
  assert.equal(restored.nothing, null);
  assert.deepEqual(restored.plain, { $date: '2026-01-01T00:00:00.000Z', other: 1 });
  assert.deepEqual(restored.lookalike, { $bigint: 'abc' });
});

test('the persister writes a snapshot that holds a BigInt', async () => {
  const store = new Map<string, string>();
  const persister = createSyncStoragePersister({
    key: 'test-cache',
    storage: {
      getItem: key => store.get(key) ?? null,
      setItem: (key, value) => void store.set(key, value),
      removeItem: key => void store.delete(key),
    },
    throttleTime: 0,
    serialize: serializeQueryCache,
    deserialize: deserializeQueryCache,
  });
  const client = {
    timestamp: 1,
    buster: 'b',
    clientState: {
      mutations: [],
      queries: [{ queryKey: ['k'], queryHash: '["k"]', state: { data: { total: BigInt(12) } } }],
    },
  } as unknown as PersistedClient;

  await persister.persistClient(client);
  await new Promise(resolve => setTimeout(resolve, 10));

  assert.ok(store.has('test-cache'));
  const restored = (await persister.restoreClient()) as PersistedClient;
  const data = restored.clientState.queries[0]?.state.data as { total: bigint };
  assert.equal(data.total, BigInt(12));
});

function fakeQuery(index: number, overrides: Record<string, unknown> = {}) {
  return {
    queryKey: [{ _id: 'getAllCategories', query: { page: index } }],
    queryHash: `q-${index}`,
    state: { status: 'success', dataUpdatedAt: index, data: { index, payload: 'x'.repeat(50) } },
    ...overrides,
  };
}

function fakeClient(queries: unknown[]): PersistedClient {
  return {
    timestamp: 1,
    buster: 'b',
    clientState: { mutations: [], queries },
  } as unknown as PersistedClient;
}

function memoryStorage(failSetItem = false) {
  const store = new Map<string, string>();
  const calls = { removeItem: 0 };
  return {
    store,
    calls,
    storage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (failSetItem) throw new Error('QuotaExceededError');
        store.set(key, value);
      },
      removeItem: (key: string) => {
        calls.removeItem += 1;
        store.delete(key);
      },
    },
  };
}

test('the trim keeps the newest 120 successful non-volatile queries', () => {
  const queries = [
    ...Array.from({ length: 300 }, (_, index) => fakeQuery(index)),
    fakeQuery(1000, { state: { status: 'error', dataUpdatedAt: 1000 } }),
    fakeQuery(1001, { queryKey: [{ _id: [...VOLATILE_GENERATED_QUERY_IDS][0] }] }),
  ];
  const trimmed = trimPersistedClient(fakeClient(queries));
  const kept = trimmed.clientState.queries;

  assert.equal(kept.length, 120);
  assert.equal(kept[0]?.queryHash, 'q-299');
  assert.equal(kept[119]?.queryHash, 'q-180');
  assert.ok(kept.every(query => query.state.status === 'success'));
  assert.ok(kept.every(query => !isVolatileGeneratedQuery(query.queryKey)));
});

test('a 1,000-query cache persists with at most two serialize calls', () => {
  const { storage, store } = memoryStorage();
  let serializeCalls = 0;
  const serialize = (client: PersistedClient) => {
    serializeCalls += 1;
    return serializeQueryCache(client);
  };
  const queries = Array.from({ length: 1000 }, (_, index) => fakeQuery(index));

  assert.equal(writeSnapshot(storage, 'k', fakeClient(queries), { serialize }), true);
  assert.equal(serializeCalls, 1);
  const restored = deserializeQueryCache(store.get('k') as string);
  assert.equal(restored.clientState.queries.length, 120);

  const fullLength = (store.get('k') as string).length;
  serializeCalls = 0;
  const oversized = writeSnapshot(storage, 'k', fakeClient(queries), {
    serialize,
    maxChars: Math.ceil(fullLength * 0.6),
  });
  assert.equal(oversized, true);
  assert.equal(serializeCalls, 2);
  assert.equal(deserializeQueryCache(store.get('k') as string).clientState.queries.length, 60);
});

test('a snapshot that still fails after halving falls back to removeItem', () => {
  const { storage, calls, store } = memoryStorage(true);
  store.set('k', 'stale');
  let serializeCalls = 0;
  const serialize = (client: PersistedClient) => {
    serializeCalls += 1;
    return serializeQueryCache(client);
  };
  const queries = Array.from({ length: 1000 }, (_, index) => fakeQuery(index));

  assert.equal(writeSnapshot(storage, 'k', fakeClient(queries), { serialize }), false);
  assert.equal(serializeCalls, 2);
  assert.equal(calls.removeItem, 1);
  assert.equal(store.has('k'), false);
});

test('the persister waits for fetching to settle and saves only the latest snapshot', async () => {
  const { storage, store } = memoryStorage();
  let fetching = 1;
  let listener: (() => void) | undefined;
  const queryClient = {
    isFetching: () => fetching,
    getQueryCache: () => ({
      subscribe: (next: () => void) => {
        listener = next;
        return () => undefined;
      },
    }),
  } as unknown as Parameters<typeof createQueryPersister>[0]['queryClient'];
  let serializeCalls = 0;
  const persister = createQueryPersister({
    queryClient,
    key: 'k',
    storage,
    quietMs: 5,
    minIntervalMs: 0,
    serialize: client => {
      serializeCalls += 1;
      return serializeQueryCache(client);
    },
  });

  await persister.persistClient(fakeClient([fakeQuery(1)]));
  await persister.persistClient(fakeClient([fakeQuery(1), fakeQuery(2)]));
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(serializeCalls, 0);

  fetching = 0;
  listener?.();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(serializeCalls, 1);
  assert.equal(deserializeQueryCache(store.get('k') as string).clientState.queries.length, 2);
});
