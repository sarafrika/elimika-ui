import { Agent, setGlobalDispatcher } from 'undici';

const KEEP_ALIVE_TIMEOUT_MS = 60_000;
const KEEP_ALIVE_MAX_TIMEOUT_MS = 10 * 60_000;
const POOL_CONNECTIONS = 64;
// Global and generous: slow exports and auth calls keep working; the proxy
// enforces its own tighter per-request budget.
const HEADERS_TIMEOUT_MS = 120_000;
const BODY_TIMEOUT_MS = 120_000;

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
      connections: POOL_CONNECTIONS,
      headersTimeout: HEADERS_TIMEOUT_MS,
      keepAliveMaxTimeout: KEEP_ALIVE_MAX_TIMEOUT_MS,
      keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS,
      pipelining: 1,
    })
  );
  installed = true;
}
