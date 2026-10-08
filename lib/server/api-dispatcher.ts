import { Agent, setGlobalDispatcher } from 'undici';

const KEEP_ALIVE_TIMEOUT_MS = 60_000;
const KEEP_ALIVE_MAX_TIMEOUT_MS = 10 * 60_000;
const POOL_CONNECTIONS = 64;
const HEADERS_TIMEOUT_MS = 20_000;
const BODY_TIMEOUT_MS = 60_000;

// HTTP/2 is negotiated via ALPN and falls back to HTTP/1.1 when the ingress
// does not offer it; API_HTTP2=false is the kill switch.
const allowH2 = process.env.API_HTTP2 !== 'false';

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
