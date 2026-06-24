import {
  buildPrivateBffCacheKey,
  clearPrivateBffCacheForUser,
  deletePrivateBffCacheEntry,
  getPrivateBffCacheEntry,
  getPrivateBffCacheTtlMs,
  PRIVATE_BFF_CACHE_MAX_BODY_BYTES,
  refreshPrivateBffCacheEntry,
  storePrivateBffCacheEntry,
  type PrivateBffCacheEntry,
} from '@/lib/api/private-bff-cache';
import { getServerApiBaseUrl } from '@/services/api/base-url';
import { auth } from '@/services/auth';
import type { Session } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AuthSession = Session | null;
type CacheState = 'BYPASS' | 'HIT' | 'MISS' | 'STALE';

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
  headers.set('cache-control', 'private, no-store');
  headers.set('x-bff-cache', cacheState);
  appendVary(headers, ['Authorization', 'Cookie']);
  return headers;
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
    Number.isFinite(parsedContentLength) &&
    parsedContentLength <= PRIVATE_BFF_CACHE_MAX_BODY_BYTES
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
  const headers = new Headers(request.headers);

  headers.delete('host');
  headers.delete('cookie');
  sanitizeHeaders(headers);

  if (!headers.get('authorization')) {
    const accessToken = session?.user?.accessToken;
    if (accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`);
    }
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
  const upstreamResponse = await fetch(upstreamUrl, {
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
    const session = await auth();
    const cacheUserId = getCacheUserId(session);
    const upstreamUrl = buildUpstreamUrl(request, path);
    const headers = getForwardHeaders(request, session);
    const isCacheableRead = request.method === 'GET' && Boolean(cacheUserId);
    const cacheKey =
      isCacheableRead && cacheUserId ? buildPrivateBffCacheKey(cacheUserId, upstreamUrl) : null;

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

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      init.duplex = 'half';
    }

    const upstreamResponse = await fetch(upstreamUrl, init);
    const responseHeaders = new Headers(upstreamResponse.headers);
    sanitizeHeaders(responseHeaders);

    if (request.method === 'GET' && cacheKey && cacheUserId && canAttemptCache(upstreamResponse)) {
      return cacheGetResponse(upstreamUrl, upstreamResponse, responseHeaders, cacheUserId, cacheKey);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD' && upstreamResponse.ok && cacheUserId) {
      clearPrivateBffCacheForUser(cacheUserId);
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: applyPrivateResponseHeaders(responseHeaders, 'BYPASS'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy request failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
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
