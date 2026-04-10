import { auth } from '@/services/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_MEDIA_HOSTS = new Set([
  'api.elimika.sarafrika.com',
  'api.elimika.staging.sarafrika.com',
]);

const ALLOWED_MEDIA_PATH_PREFIXES = ['/api/v1/courses/media/'];

function resolveUpstreamUrl(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return null;
  }

  try {
    const upstreamUrl = new URL(rawUrl);
    if (!ALLOWED_MEDIA_HOSTS.has(upstreamUrl.hostname)) {
      return null;
    }

    if (!ALLOWED_MEDIA_PATH_PREFIXES.some(prefix => upstreamUrl.pathname.startsWith(prefix))) {
      return null;
    }

    return upstreamUrl;
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
