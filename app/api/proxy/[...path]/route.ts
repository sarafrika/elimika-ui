import { auth } from '@/services/auth';
import { getServerApiBaseUrl } from '@/services/api/base-url';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

const getForwardHeaders = async (request: NextRequest) => {
  const headers = new Headers(request.headers);

  headers.delete('host');
  headers.delete('cookie');
  sanitizeHeaders(headers);

  if (!headers.get('authorization')) {
    const session = await auth();
    const accessToken = session?.user?.accessToken;
    if (accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`);
    }
  }

  return headers;
};

const proxyRequest = async (request: NextRequest, path: string[]) => {
  try {
    const upstreamUrl = buildUpstreamUrl(request, path);
    const headers = await getForwardHeaders(request);

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

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
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
