const ALLOWED_MEDIA_HOSTS = new Set([
  'api.elimika.sarafrika.com',
  'api.elimika.staging.sarafrika.com',
]);

const ALLOWED_MEDIA_PATH_PREFIXES = ['/api/v1/courses/media/', '/api/v1/courses/content-media/'];
const AUTHENTICATED_MEDIA_ROUTE = '/api/media';
const PROXY_MEDIA_ROUTE = '/api/proxy';

function isAllowedMediaPath(pathname: string) {
  return ALLOWED_MEDIA_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function toProxyMediaUrl(pathname: string) {
  return `${PROXY_MEDIA_ROUTE}${pathname}`;
}

export function toAuthenticatedMediaUrl(url?: string | null) {
  if (!url) {
    return url;
  }

  if (url.startsWith('/')) {
    if (!isAllowedMediaPath(url)) {
      return url;
    }

    return url.startsWith('/api/v1/courses/content-media/') ? toProxyMediaUrl(url) : url;
  }

  try {
    const parsedUrl = new URL(url);
    if (!ALLOWED_MEDIA_HOSTS.has(parsedUrl.hostname)) {
      return url;
    }

    if (!isAllowedMediaPath(parsedUrl.pathname)) {
      return url;
    }

    if (parsedUrl.pathname.startsWith('/api/v1/courses/content-media/')) {
      return toProxyMediaUrl(parsedUrl.pathname);
    }

    return `${AUTHENTICATED_MEDIA_ROUTE}?url=${encodeURIComponent(parsedUrl.toString())}`;
  } catch {
    return url;
  }
}

export function isAuthenticatedMediaUrl(url?: string | null) {
  return typeof url === 'string' && url.startsWith(`${AUTHENTICATED_MEDIA_ROUTE}?`);
}
