import { auth } from '@/services/auth';
import { getServerApiBaseUrl } from '@/services/api/base-url';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_MEDIA_HOSTS = new Set([
  'api.elimika.sarafrika.com',
  'api.elimika.staging.sarafrika.com',
]);

const ALLOWED_MEDIA_PATH_PREFIXES = ['/api/v1/courses/media/', '/api/v1/courses/content-media/'];

function resolveUpstreamUrl(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(rawUrl);
    if (!ALLOWED_MEDIA_HOSTS.has(parsedUrl.hostname)) {
      return null;
    }

    if (!ALLOWED_MEDIA_PATH_PREFIXES.some(prefix => parsedUrl.pathname.startsWith(prefix))) {
      return null;
    }

    // Re-root the path onto API_BASE_URL so staging internal networking is respected,
    // the same way app/api/proxy/[...path]/route.ts does.
    const apiBase = new URL(getServerApiBaseUrl());
    const apiBasePath = apiBase.pathname.replace(/\/$/, '');
    const mediaPath = parsedUrl.pathname;
    const dedupedPath =
      apiBasePath && mediaPath.startsWith(`${apiBasePath}/`)
        ? mediaPath.slice(apiBasePath.length)
        : mediaPath;
    apiBase.pathname = `${apiBasePath}${dedupedPath}`.replace(/\/{2,}/g, '/');
    apiBase.search = parsedUrl.search;

    return apiBase;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const upstreamUrl = resolveUpstreamUrl(request);
  if (!upstreamUrl) {
    return NextResponse.json({ success: false, message: 'Invalid media URL.' }, { status: 400 });
  }

  const session = await auth();
  const accessToken = session?.user?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!upstreamResponse.ok) {
    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        'content-type': upstreamResponse.headers.get('content-type') ?? 'application/octet-stream',
        'cache-control': 'private, no-store',
      },
    });
  }

  const responseHeaders = new Headers({
    'content-type': upstreamResponse.headers.get('content-type') ?? 'application/octet-stream',
    'cache-control': 'private, no-store',
  });

  const contentLength = upstreamResponse.headers.get('content-length');
  if (contentLength) {
    responseHeaders.set('content-length', contentLength);
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}
