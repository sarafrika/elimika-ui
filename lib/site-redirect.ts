import { NextResponse } from 'next/server';

type RequestLike = { headers: Headers; nextUrl: URL };

/** What a container listens on, never where a browser actually is. */
const BIND_ADDRESS = /^(0\.0\.0\.0|\[::\]|::)(:\d+)?$/;
const LOOPBACK = /^(localhost|127\.0\.0\.1)(:\d+)?$/i;

/**
 * Where the browser thinks it is.
 *
 * A proxy that forwards the scheme but not the original host leaves only the
 * upstream address in Host, and redirecting there sends people to
 * https://0.0.0.0:3000. Fall back to the configured public origin instead.
 */
function resolvePublicOrigin(request: RequestLike) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host')?.trim() || '';

  if (host && !BIND_ADDRESS.test(host)) {
    const protocol = forwardedProto || (LOOPBACK.test(host) ? 'http' : 'https');
    return `${protocol}://${host}`;
  }

  return (
    validOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    validOrigin(process.env.AUTH_URL) ??
    request.nextUrl.origin
  );
}

/** A deploy that never substituted its placeholder leaves `__NEXT_PUBLIC_SITE_URL__` here. */
function validOrigin(value?: string) {
  const trimmed = value?.trim().replace(/\/+$/, '');
  if (!trimmed || /^__.+__$/.test(trimmed)) return undefined;

  try {
    return new URL(trimmed).origin;
  } catch {
    return undefined;
  }
}

/** Redirect to a path on this site. Next rejects a relative Location, so this builds one. */
export function redirectToPath(request: RequestLike, path: string, status: 307 | 308 = 307) {
  // A protocol-relative target would leave the site entirely, so refuse one.
  const safePath = path.startsWith('/') && !path.startsWith('//') ? path : '/';

  return NextResponse.redirect(new URL(safePath, resolvePublicOrigin(request)), status);
}
