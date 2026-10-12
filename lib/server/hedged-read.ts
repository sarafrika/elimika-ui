import { logger } from '../logger';

export const DEFAULT_HEDGE_AFTER_MS = 1200;
// Staging answers a stuck read with a 500 after ~10 s; anything this slow is retried.
const DEFAULT_SLOW_FAILURE_MS = 5000;
const CONNECT_TIMEOUT_CODE = 'UND_ERR_CONNECT_TIMEOUT';

type AttemptKind = 'primary' | 'hedge' | 'retry';
type FetchLike = (url: URL, init: RequestInit) => Promise<Response>;

export type HedgedReadOptions = {
  signal?: AbortSignal;
  fetchImpl?: FetchLike;
  hedgeAfterMs?: number;
  slowFailureMs?: number;
  /** Init for hedge and retry attempts (e.g. a separate dispatcher); the primary keeps `init`. */
  alternateInit?: RequestInit;
};

/** Hedge delay from API_READ_HEDGE_MS; 0 turns hedging off. */
export function getHedgeAfterMs() {
  const raw = process.env.API_READ_HEDGE_MS;
  const parsed = raw === undefined || raw === '' ? Number.NaN : Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_HEDGE_AFTER_MS;
}

export function isConnectTimeout(error: unknown) {
  const cause = error instanceof Error ? (error.cause as { code?: unknown } | undefined) : undefined;
  return cause?.code === CONNECT_TIMEOUT_CODE;
}

function discard(response: Response | undefined) {
  response?.body?.cancel().catch(() => undefined);
}

type Attempt = { kind: AttemptKind; controller: AbortController; startedAt: number };

/**
 * Body-less GET/HEAD with one hedge after hedgeAfterMs, or one retry after a slow 5xx
 * or connect timeout. At most two upstream attempts; anything else is a single fetch.
 */
export function hedgedRead(url: URL, init: RequestInit, options: HedgedReadOptions = {}) {
  const fetchImpl = options.fetchImpl ?? ((target, requestInit) => fetch(target, requestInit));
  const method = (init.method ?? 'GET').toUpperCase();
  const outerSignal = options.signal;
  if ((method !== 'GET' && method !== 'HEAD') || init.body) {
    return fetchImpl(url, outerSignal ? { ...init, signal: outerSignal } : init);
  }

  const hedgeAfterMs = options.hedgeAfterMs ?? getHedgeAfterMs();
  const slowFailureMs = options.slowFailureMs ?? DEFAULT_SLOW_FAILURE_MS;
  const startedAt = Date.now();

  return new Promise<Response>((resolve, reject) => {
    const attempts: Attempt[] = [];
    let inFlight = 0;
    let settled = false;
    let held: Response | undefined;
    let hedgeTimer: ReturnType<typeof setTimeout> | undefined;

    const clearHedge = () => {
      if (hedgeTimer) clearTimeout(hedgeTimer);
      hedgeTimer = undefined;
    };

    const report = (winner: AttemptKind | 'none', status?: number) => {
      if (attempts.length < 2) return;
      const context = {
        path: url.pathname,
        elapsedMs: Date.now() - startedAt,
        attempts: attempts.map(attempt => attempt.kind),
        winner,
        status,
      };
      if (attempts.some(attempt => attempt.kind === 'retry')) {
        logger.error('BFF read retried after a slow upstream failure', context);
      } else {
        logger.warn('BFF read hedged after a slow upstream response', context);
      }
    };

    const finish = (attempt: Attempt | undefined, response: Response | undefined, error?: unknown) => {
      settled = true;
      clearHedge();
      for (const other of attempts) {
        if (other !== attempt) other.controller.abort();
      }
      if (held && held !== response) discard(held);
      report(attempt?.kind ?? 'none', response?.status);
      if (response) resolve(response);
      else reject(error);
    };

    const canRetry = () => attempts.length < 2 && method === 'GET' && !outerSignal?.aborted;

    const launch = (kind: AttemptKind) => {
      const controller = new AbortController();
      const attempt: Attempt = { kind, controller, startedAt: Date.now() };
      attempts.push(attempt);
      inFlight += 1;
      const signal = outerSignal
        ? AbortSignal.any([controller.signal, outerSignal])
        : controller.signal;
      const base = kind === 'primary' ? init : (options.alternateInit ?? init);
      fetchImpl(url, { ...base, signal }).then(
        response => onResponse(attempt, response),
        error => onError(attempt, error)
      );
    };

    const onResponse = (attempt: Attempt, response: Response) => {
      inFlight -= 1;
      if (settled) {
        discard(response);
        return;
      }
      clearHedge();
      if (response.status < 500) {
        finish(attempt, response);
        return;
      }
      if (inFlight > 0) {
        discard(held);
        held = response;
        return;
      }
      if (canRetry() && Date.now() - attempt.startedAt >= slowFailureMs) {
        discard(response);
        launch('retry');
        return;
      }
      finish(attempt, response);
    };

    const onError = (attempt: Attempt, error: unknown) => {
      inFlight -= 1;
      if (settled) return;
      clearHedge();
      if (inFlight > 0) return;
      if (!held && canRetry() && isConnectTimeout(error)) {
        launch('retry');
        return;
      }
      if (held) finish(undefined, held);
      else finish(attempt, undefined, error);
    };

    launch('primary');
    if (hedgeAfterMs > 0) {
      hedgeTimer = setTimeout(() => {
        hedgeTimer = undefined;
        if (!settled && attempts.length === 1 && inFlight === 1 && !outerSignal?.aborted) {
          launch('hedge');
        }
      }, hedgeAfterMs);
    }
  });
}
