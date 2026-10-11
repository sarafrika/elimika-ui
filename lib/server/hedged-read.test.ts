import assert from 'node:assert/strict';
import test from 'node:test';
import { hedgedRead } from './hedged-read';

const URL_UNDER_TEST = new URL('https://api.example.test/api/v1/classes/abc?x=1');

type Step = { delayMs: number; status?: number; error?: Error };

// Each call to the fake consumes the next scripted step and honours its abort signal.
function scriptedFetch(steps: Step[]) {
  const calls: { method?: string; aborted: () => boolean }[] = [];
  const fetchImpl = (_url: URL, init: RequestInit) => {
    const step = steps[calls.length] ?? steps[steps.length - 1];
    const signal = init.signal;
    calls.push({ method: init.method, aborted: () => Boolean(signal?.aborted) });
    return new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (step.error) reject(step.error);
        else resolve(new Response(`status-${step.status}`, { status: step.status ?? 200 }));
      }, step.delayMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('aborted'));
      });
    });
  };
  return { calls, fetchImpl };
}

test('the hedge wins when the first attempt is slow, and the slow one is aborted', async () => {
  const { calls, fetchImpl } = scriptedFetch([
    { delayMs: 500, status: 200 },
    { delayMs: 10, status: 200 },
  ]);
  const started = Date.now();
  const response = await hedgedRead(URL_UNDER_TEST, { method: 'GET' }, { fetchImpl, hedgeAfterMs: 30 });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
  assert.ok(Date.now() - started < 300);
  assert.equal(calls[0].aborted(), true);
});

test('a fast read never hedges', async () => {
  const { calls, fetchImpl } = scriptedFetch([{ delayMs: 5, status: 200 }]);
  const response = await hedgedRead(URL_UNDER_TEST, { method: 'GET' }, { fetchImpl, hedgeAfterMs: 50 });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
});

test('a slow 5xx is retried exactly once', async () => {
  const { calls, fetchImpl } = scriptedFetch([
    { delayMs: 60, status: 500 },
    { delayMs: 5, status: 200 },
  ]);
  const response = await hedgedRead(
    URL_UNDER_TEST,
    { method: 'GET' },
    { fetchImpl, hedgeAfterMs: 0, slowFailureMs: 50 }
  );
  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
});

test('a retried slow 5xx that fails again is returned, not retried twice', async () => {
  const { calls, fetchImpl } = scriptedFetch([{ delayMs: 60, status: 500 }]);
  const response = await hedgedRead(
    URL_UNDER_TEST,
    { method: 'GET' },
    { fetchImpl, hedgeAfterMs: 0, slowFailureMs: 50 }
  );
  assert.equal(response.status, 500);
  assert.equal(calls.length, 2);
});

test('a fast 5xx and a 4xx are never retried', async () => {
  for (const status of [500, 404]) {
    const { calls, fetchImpl } = scriptedFetch([{ delayMs: 5, status }]);
    const response = await hedgedRead(
      URL_UNDER_TEST,
      { method: 'GET' },
      { fetchImpl, hedgeAfterMs: 0, slowFailureMs: 50 }
    );
    assert.equal(response.status, status);
    assert.equal(calls.length, 1);
  }
});

test('a connect timeout is retried once', async () => {
  const connectTimeout = new Error('fetch failed', {
    cause: Object.assign(new Error('connect'), { code: 'UND_ERR_CONNECT_TIMEOUT' }),
  });
  const { calls, fetchImpl } = scriptedFetch([
    { delayMs: 5, error: connectTimeout },
    { delayMs: 5, status: 200 },
  ]);
  const response = await hedgedRead(URL_UNDER_TEST, { method: 'GET' }, { fetchImpl, hedgeAfterMs: 0 });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
});

test('a mutating request is never hedged or retried', async () => {
  for (const method of ['DELETE', 'POST', 'PUT']) {
    const { calls, fetchImpl } = scriptedFetch([{ delayMs: 80, status: 500 }]);
    const response = await hedgedRead(
      URL_UNDER_TEST,
      { method },
      { fetchImpl, hedgeAfterMs: 10, slowFailureMs: 20 }
    );
    assert.equal(response.status, 500);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, method);
  }
});

test('the hedge waits for the other attempt when one returns 5xx', async () => {
  const { calls, fetchImpl } = scriptedFetch([
    { delayMs: 60, status: 500 },
    { delayMs: 80, status: 200 },
  ]);
  const response = await hedgedRead(
    URL_UNDER_TEST,
    { method: 'GET' },
    { fetchImpl, hedgeAfterMs: 20, slowFailureMs: 30 }
  );
  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
});
