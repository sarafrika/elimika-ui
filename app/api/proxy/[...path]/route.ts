import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import {
  buildPrivateBffCacheKey,
  clearPrivateBffCacheForUser,
  deletePrivateBffCacheEntry,
  getPrivateBffCacheEntry,
  getPrivateBffCacheTtlMs,
  isPrivateBffCacheBypassed,
  PRIVATE_BFF_CACHE_MAX_BODY_BYTES,
  type PrivateBffCacheEntry,
  refreshPrivateBffCacheEntry,
  storePrivateBffCacheEntry,
} from '@/lib/api/private-bff-cache';
import { getServerApiBaseUrl } from '@/services/api/base-url';
import { auth } from '@/services/auth';
import { ACTING_DOMAIN_HEADER } from '@/src/features/dashboard/lib/active-domain-storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AuthSession = Session | null;
type CacheState = 'BYPASS' | 'HIT' | 'MISS' | 'STALE';

// Wall-clock budget for body-less requests only: with a streamed body it would
// also cover the upload, so those rely on the dispatcher's per-phase timeouts.
const UPSTREAM_TIMEOUT_MS = 20_000;
const UNDICI_TIMEOUT_CODES = new Set(['UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT']);

class UpstreamTimeoutError extends Error {}

function isUpstreamTimeout(error: unknown) {
  if (error instanceof UpstreamTimeoutError) {
    return true;
  }
  const cause =
    error instanceof Error ? (error.cause as { code?: unknown } | undefined) : undefined;
  return typeof cause?.code === 'string' && UNDICI_TIMEOUT_CODES.has(cause.code);
}

async function fetchUpstream(
  url: URL,
  init: RequestInit & { duplex?: 'half' },
  clientSignal?: AbortSignal
) {
  if (init.body) {
    return fetch(url, clientSignal ? { ...init, signal: clientSignal } : init);
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new UpstreamTimeoutError('Upstream API timed out')),
    UPSTREAM_TIMEOUT_MS
  );
  const signal = clientSignal
    ? AbortSignal.any([controller.signal, clientSignal])
    : controller.signal;

  try {
    return await fetch(url, { ...init, signal });
  } catch (error) {
    throw controller.signal.aborted ? controller.signal.reason : error;
  } finally {
    clearTimeout(timer);
  }
}

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const sanitizeHeaders = (headers: Headers) => {
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }
};

// Next copies middleware response headers (session cookies) into req.headers, so
// requests forward only these names. Not exported: route.ts exports are type-checked.
const FORWARD_HEADER_ALLOWLIST = {
  authenticated: [
    'accept',
    'accept-language',
    'content-type',
    'if-none-match',
    'if-modified-since',
    'if-match',
    'range',
    'if-range',
    'user-agent',
    'x-request-id',
    'x-forwarded-for',
    ACTING_DOMAIN_HEADER,
  ],
  publicFile: [
    'accept',
    'accept-language',
    'if-none-match',
    'if-modified-since',
    'range',
    'if-range',
    'user-agent',
  ],
} as const;

const NEVER_FORWARDED_HEADERS = new Set(['authorization', 'cookie', 'host', 'rsc', 'set-cookie']);
const NEVER_FORWARDED_PREFIXES = ['x-middleware-', 'next-'];

function isNeverForwarded(name: string) {
  const lower = name.toLowerCase();
  return (
    NEVER_FORWARDED_HEADERS.has(lower) ||
    HOP_BY_HOP_HEADERS.has(lower) ||
    NEVER_FORWARDED_PREFIXES.some(prefix => lower.startsWith(prefix))
  );
}

function pickForwardHeaders(source: Headers, allowed: readonly string[]) {
  const headers = new Headers();
  for (const name of allowed) {
    const value = source.get(name);
    if (value !== null && !isNeverForwarded(name)) {
      headers.set(name, value);
    }
  }
  return headers;
}

function stripUpstreamSessionHeaders(headers: Headers) {
  headers.delete('set-cookie');
  for (const name of Array.from(headers.keys())) {
    if (name.toLowerCase().startsWith('x-middleware-')) {
      headers.delete(name);
    }
  }
}

function appendVary(headers: Headers, values: string[]) {
  const existing = headers.get('vary');
  if (existing === '*') {
    return;
  }

  const next = new Set(
    existing
      ?.split(',')
      .map(value => value.trim())
      .filter(Boolean)
  );

  for (const value of values) {
    next.add(value);
  }

  headers.set('vary', Array.from(next).join(', '));
}

function applyPrivateResponseHeaders(headers: Headers, cacheState: CacheState) {
  sanitizeHeaders(headers);
  stripUpstreamSessionHeaders(headers);
  headers.set('cache-control', 'private, no-store');
  headers.set('x-bff-cache', cacheState);
  appendVary(headers, ['Authorization', 'Cookie', ACTING_DOMAIN_HEADER]);
  return headers;
}

const PUBLIC_FILES_PREFIX = '/api/v1/files/';
const PUBLIC_FILE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PUBLIC_FILE_MISSING_CACHE_CONTROL = 'public, max-age=300';

// Files are permitAll upstream except profile_documents, so the check runs on the
// normalised upstream path to stop dot-segments from smuggling a private path through.
function isPublicFileRead(request: NextRequest, upstreamUrl: URL) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false;
  }

  const basePath = new URL(getServerApiBaseUrl()).pathname.replace(/\/$/, '');
  const pathname = upstreamUrl.pathname.slice(basePath.length);
  if (!pathname.startsWith(PUBLIC_FILES_PREFIX)) {
    return false;
  }

  try {
    return !decodeURIComponent(pathname).toLowerCase().includes('profile_documents');
  } catch {
    return false;
  }
}

function getPublicFileCacheControl(status: number) {
  if (status === 200 || status === 206 || status === 304) {
    return PUBLIC_FILE_CACHE_CONTROL;
  }
  return status === 404 ? PUBLIC_FILE_MISSING_CACHE_CONTROL : 'no-store';
}

function dropVary(headers: Headers, values: string[]) {
  const drop = new Set(values.map(value => value.toLowerCase()));
  const kept = (headers.get('vary') ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(value => value && !drop.has(value.toLowerCase()));
  if (kept.length > 0) {
    headers.set('vary', kept.join(', '));
  } else {
    headers.delete('vary');
  }
}

async function proxyPublicFile(request: NextRequest, upstreamUrl: URL) {
  const headers = pickForwardHeaders(request.headers, FORWARD_HEADER_ALLOWLIST.publicFile);

  const upstreamResponse = await fetchUpstream(
    upstreamUrl,
    { method: request.method, headers, redirect: 'manual' },
    request.signal
  );
  const responseHeaders = new Headers(upstreamResponse.headers);
  sanitizeHeaders(responseHeaders);
  stripUpstreamSessionHeaders(responseHeaders);
  responseHeaders.delete('pragma');
  responseHeaders.delete('expires');
  dropVary(responseHeaders, ['Authorization', 'Cookie', ACTING_DOMAIN_HEADER]);
  responseHeaders.set('cache-control', getPublicFileCacheControl(upstreamResponse.status));
  responseHeaders.set('x-bff-cache', 'PUBLIC');

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

function getCacheUserId(session: AuthSession) {
  const userId = session?.user?.id ?? session?.user?.email;
  return typeof userId === 'string' && userId.trim().length > 0 ? userId : null;
}

function isJsonResponse(response: Response) {
  return response.headers.get('content-type')?.toLowerCase().includes('json') ?? false;
}

function canAttemptCache(response: Response) {
  if (response.status !== 200 || !isJsonResponse(response)) {
    return false;
  }

  const contentLength = response.headers.get('content-length');
  if (!contentLength) {
    return true;
  }

  const parsedContentLength = Number(contentLength);
  return (
    Number.isFinite(parsedContentLength) && parsedContentLength <= PRIVATE_BFF_CACHE_MAX_BODY_BYTES
  );
}

function buildCachedResponse(entry: PrivateBffCacheEntry, cacheState: CacheState) {
  const headers = applyPrivateResponseHeaders(new Headers(entry.headers), cacheState);
  return new NextResponse(entry.body, {
    status: entry.status,
    headers,
  });
}

const buildUpstreamUrl = (request: NextRequest, path: string[]) => {
  const upstream = new URL(getServerApiBaseUrl());
  const requestedPath = `/${path.join('/')}`;
  const upstreamBasePath = upstream.pathname.replace(/\/$/, '');
  const dedupedPath =
    upstreamBasePath &&
    (requestedPath === upstreamBasePath || requestedPath.startsWith(`${upstreamBasePath}/`))
      ? (requestedPath.slice(upstreamBasePath.length) ?? '/')
      : requestedPath;
  upstream.pathname = `${upstreamBasePath}${dedupedPath}`.replace(/\/{2,}/g, '/');
  upstream.search = request.nextUrl.search;
  return upstream;
};

const getForwardHeaders = (request: NextRequest, session: AuthSession) => {
  const headers = pickForwardHeaders(request.headers, FORWARD_HEADER_ALLOWLIST.authenticated);
  const contentLength = request.headers.get('content-length');
  if (contentLength && request.method !== 'GET' && request.method !== 'HEAD') {
    headers.set('content-length', contentLength);
  }

  const incomingAuthorization = request.headers.get('authorization');
  const accessToken = session?.user?.accessToken;
  if (incomingAuthorization) {
    headers.set('authorization', incomingAuthorization);
  } else if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }

  return headers;
};

async function cacheGetResponse(
  upstreamUrl: URL,
  upstreamResponse: Response,
  responseHeaders: Headers,
  cacheUserId: string,
  cacheKey: string
) {
  const body = await upstreamResponse.text();
  const stored = storePrivateBffCacheEntry({
    body,
    headers: responseHeaders,
    key: cacheKey,
    status: upstreamResponse.status,
    ttlMs: getPrivateBffCacheTtlMs(upstreamUrl),
    url: upstreamUrl.toString(),
    userId: cacheUserId,
  });

  return new NextResponse(body, {
    status: upstreamResponse.status,
    headers: applyPrivateResponseHeaders(responseHeaders, stored ? 'MISS' : 'BYPASS'),
  });
}

async function refreshCachedGet(
  upstreamUrl: URL,
  headers: Headers,
  cacheUserId: string,
  cacheKey: string
) {
  const upstreamResponse = await fetchUpstream(upstreamUrl, {
    headers: new Headers(headers),
    method: 'GET',
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  sanitizeHeaders(responseHeaders);

  if (canAttemptCache(upstreamResponse)) {
    await cacheGetResponse(upstreamUrl, upstreamResponse, responseHeaders, cacheUserId, cacheKey);
    return;
  }

  if (upstreamResponse.ok) {
    deletePrivateBffCacheEntry(cacheKey);
  }

  await upstreamResponse.body?.cancel().catch(() => undefined);
}

const proxyRequest = async (request: NextRequest, path: string[]) => {
  try {
    const upstreamUrl = buildUpstreamUrl(request, path);
    if (isPublicFileRead(request, upstreamUrl)) {
      return await proxyPublicFile(request, upstreamUrl);
    }

    const session = await auth();
    const cacheUserId = getCacheUserId(session);
    const headers = getForwardHeaders(request, session);
    // Decision queues and platform counts are read fresh every time: a cached answer
    // would show one admin work that another has already cleared.
    const isCacheableRead =
      request.method === 'GET' && Boolean(cacheUserId) && !isPrivateBffCacheBypassed(upstreamUrl);
    // The acting dashboard varies the upstream answer, so it has to vary the key
    // as well: one user, one URL, two dashboards, two cache entries.
    const actingDomain = headers.get(ACTING_DOMAIN_HEADER);
    const cacheKey =
      isCacheableRead && cacheUserId
        ? buildPrivateBffCacheKey(cacheUserId, upstreamUrl, actingDomain)
        : null;

    if (cacheKey && cacheUserId) {
      const cachedResponse = getPrivateBffCacheEntry(cacheKey);

      if (cachedResponse.state === 'fresh') {
        return buildCachedResponse(cachedResponse.entry, 'HIT');
      }

      if (cachedResponse.state === 'stale') {
        refreshPrivateBffCacheEntry(cacheKey, () =>
          refreshCachedGet(upstreamUrl, headers, cacheUserId, cacheKey)
        );

        return buildCachedResponse(cachedResponse.entry, 'STALE');
      }
    }

    const init: RequestInit & { duplex?: 'half' } = {
      method: request.method,
      headers,
      redirect: 'manual',
    };
    const isMutatingRequest = request.method !== 'GET' && request.method !== 'HEAD';

    if (isMutatingRequest) {
      init.body = request.body;
      init.duplex = 'half';
    }

    const upstreamResponse = await fetchUpstream(upstreamUrl, init, request.signal);
    const responseHeaders = new Headers(upstreamResponse.headers);
    sanitizeHeaders(responseHeaders);

    if (request.method === 'GET' && cacheKey && cacheUserId && canAttemptCache(upstreamResponse)) {
      return cacheGetResponse(
        upstreamUrl,
        upstreamResponse,
        responseHeaders,
        cacheUserId,
        cacheKey
      );
    }

    if (isMutatingRequest && cacheUserId) {
      clearPrivateBffCacheForUser(cacheUserId);
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: applyPrivateResponseHeaders(responseHeaders, 'BYPASS'),
    });
  } catch (error) {
    // The browser already went away; nobody reads this, so keep it out of 5xx counts.
    if (request.signal.aborted) {
      return new NextResponse(null, { status: 499 });
    }
    const message = error instanceof Error ? error.message : 'Proxy request failed';
    const status = isUpstreamTimeout(error) ? 504 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
};

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
