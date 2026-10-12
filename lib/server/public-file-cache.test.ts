import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPublicFileCache,
  etagMatches,
  isPublicFileCacheable,
  type PublicFileEntry,
  publicFileCacheKey,
} from './public-file-cache';

const KB = 1024;

function entry(bytes: number, expiresAt = Number.MAX_SAFE_INTEGER): PublicFileEntry {
  return {
    status: 200,
    body: new Uint8Array(bytes),
    contentType: 'image/png',
    contentDisposition: null,
    etag: '"abc"',
    lastModified: null,
    expiresAt,
  };
}

function fileResponse(bytes: number, status = 200) {
  return new Response(new Uint8Array(bytes), {
    status,
    headers: { 'content-type': 'image/png', 'content-length': String(bytes), etag: '"abc"' },
  });
}

test('the LRU keeps total bytes under its cap by evicting the least recently used', () => {
  const cache = createPublicFileCache({ maxTotalBytes: 10 * KB });
  for (const key of ['a', 'b', 'c']) assert.equal(cache.set(key, entry(2 * KB)), true);
  assert.ok(cache.get('a'));
  assert.equal(cache.set('d', entry(4 * KB)), true);
  assert.ok(cache.size() <= 10 * KB);
  assert.equal(cache.get('b'), undefined);
  assert.ok(cache.get('a'));
  assert.ok(cache.get('d'));
});

test('an entry over 1 MB is never stored', () => {
  const cache = createPublicFileCache();
  assert.equal(cache.set('big', entry(1024 * KB + 1)), false);
  assert.equal(cache.count(), 0);
});

test('expired entries are dropped on read', () => {
  let clock = 0;
  const cache = createPublicFileCache({ now: () => clock });
  cache.set('a', entry(10, 100));
  clock = 101;
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.size(), 0);
});

test('concurrent misses share one upstream fetch, then the next read is a hit', async () => {
  const cache = createPublicFileCache();
  let fetches = 0;
  const fetchUpstream = async () => {
    fetches += 1;
    await new Promise(resolve => setTimeout(resolve, 10));
    return fileResponse(2 * KB);
  };
  const [first, second] = await Promise.all([
    cache.load('k', fetchUpstream),
    cache.load('k', fetchUpstream),
  ]);
  assert.equal(fetches, 1);
  assert.ok('entry' in first && 'entry' in second);
  const third = await cache.load('k', fetchUpstream);
  assert.ok('entry' in third && third.hit);
  assert.equal(fetches, 1);
});

test('a file without a usable content-length streams instead of caching', async () => {
  const cache = createPublicFileCache();
  const loaded = await cache.load('k', async () => new Response('x', { status: 200 }));
  assert.ok('response' in loaded);
  assert.equal(cache.count(), 0);
});

test('a 404 is kept, a 500 is not', async () => {
  const cache = createPublicFileCache();
  const missing = await cache.load('gone', async () => fileResponse(0, 404));
  assert.ok('entry' in missing && missing.entry.status === 404);
  const failed = await cache.load('err', async () => fileResponse(10, 500));
  assert.ok('response' in failed);
  assert.equal(cache.count(), 1);
});

test('Range, If-Range and HEAD bypass the cache', () => {
  assert.equal(isPublicFileCacheable('GET', new Headers()), true);
  assert.equal(isPublicFileCacheable('GET', new Headers({ range: 'bytes=0-10' })), false);
  assert.equal(isPublicFileCacheable('GET', new Headers({ 'if-range': '"abc"' })), false);
  assert.equal(isPublicFileCacheable('HEAD', new Headers()), false);
});

test('keys keep the query string and If-None-Match honours weak tags and lists', () => {
  assert.equal(
    publicFileCacheKey(new URL('https://api.test/api/v1/files/class_thumbnails/a.png?w=2')),
    '/api/v1/files/class_thumbnails/a.png?w=2'
  );
  assert.equal(etagMatches('W/"abc", "def"', '"abc"'), true);
  assert.equal(etagMatches('"zzz"', '"abc"'), false);
  assert.equal(etagMatches(null, '"abc"'), false);
});
