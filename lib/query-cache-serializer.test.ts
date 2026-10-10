import assert from 'node:assert/strict';
import test from 'node:test';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { deserializeQueryCache, serializeQueryCache } from './query-cache-serializer';

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
