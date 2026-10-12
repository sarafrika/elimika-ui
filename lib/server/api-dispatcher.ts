import { Agent, type Dispatcher, setGlobalDispatcher } from 'undici';

const KEEP_ALIVE_TIMEOUT_MS = 60_000;
const KEEP_ALIVE_MAX_TIMEOUT_MS = 10 * 60_000;
const POOL_CONNECTIONS = 64;
// Global and generous: slow exports and auth calls keep working; the proxy
// enforces its own tighter per-request budget.
const HEADERS_TIMEOUT_MS = 120_000;
const BODY_TIMEOUT_MS = 120_000;
// A TCP/TLS handshake that has not finished in 3 s is dead; fail fast so the read retries.
const CONNECT_TIMEOUT_MS = 3000;

// undici's HTTP/2 client is experimental (duplex uploads, aborts), so it is
// opt-in via API_HTTP2=true until an upload smoke test passes over h2.
const allowH2 = process.env.API_HTTP2 === 'true';

let installed = false;

/** Pools warm keep-alive sockets to the API so server fetches skip TCP+TLS setup. */
export function installApiDispatcher() {
  if (installed) {
    return;
  }

  // No custom lookup: connections resolve via dns.lookup, so force-ipv4.cjs still applies.
  setGlobalDispatcher(
    new Agent({
      allowH2,
      bodyTimeout: BODY_TIMEOUT_MS,
      connect: { timeout: CONNECT_TIMEOUT_MS },
      connections: POOL_CONNECTIONS,
      headersTimeout: HEADERS_TIMEOUT_MS,
      keepAliveMaxTimeout: KEEP_ALIVE_MAX_TIMEOUT_MS,
      keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS,
      pipelining: 1,
    })
  );
  installed = true;
}

// Body-less reads multiplex over a few warm h2 sessions instead of opening a
// TCP+TLS socket per parallel request; API_HTTP2_READS=false falls back to h1.
const READ_PIPELINING = 100;
const READ_CONNECTIONS = 4;
const readsOverH2 = process.env.API_HTTP2_READS !== 'false';

// Each built chunk has its own module scope, so the Agents live on globalThis:
// the instrumentation warm-up and the proxy route then share one instance.
const READ_DISPATCHER_KEY = Symbol.for('elimika.api.readDispatcher');
const HEDGE_DISPATCHER_KEY = Symbol.for('elimika.api.hedgeDispatcher');
const HEDGE_CONNECTIONS = 16;

type DispatcherStore = Record<symbol, Dispatcher | undefined>;
const store = globalThis as unknown as DispatcherStore;

/** Dispatcher for body-less upstream reads, or undefined when the kill switch is set. */
export function getApiReadDispatcher(): Dispatcher | undefined {
  if (!readsOverH2) {
    return undefined;
  }
  store[READ_DISPATCHER_KEY] ??= new Agent({
    allowH2: true,
    bodyTimeout: BODY_TIMEOUT_MS,
    connect: { timeout: CONNECT_TIMEOUT_MS },
    connections: READ_CONNECTIONS,
    headersTimeout: HEADERS_TIMEOUT_MS,
    keepAliveMaxTimeout: KEEP_ALIVE_MAX_TIMEOUT_MS,
    keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS,
    pipelining: READ_PIPELINING,
  });
  return store[READ_DISPATCHER_KEY];
}

/** HTTP/1.1 pool for hedges and retries, so a stalled h2 session cannot hold them too. */
export function getApiHedgeDispatcher(): Dispatcher {
  store[HEDGE_DISPATCHER_KEY] ??= new Agent({
    allowH2: false,
    bodyTimeout: BODY_TIMEOUT_MS,
    connect: { timeout: CONNECT_TIMEOUT_MS },
    connections: HEDGE_CONNECTIONS,
    headersTimeout: HEADERS_TIMEOUT_MS,
    keepAliveMaxTimeout: KEEP_ALIVE_MAX_TIMEOUT_MS,
    keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS,
    pipelining: 1,
  });
  return store[HEDGE_DISPATCHER_KEY];
}
