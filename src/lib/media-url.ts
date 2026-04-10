const ALLOWED_MEDIA_HOSTS = new Set([
  'api.elimika.sarafrika.com',
  'api.elimika.staging.sarafrika.com',
]);

const ALLOWED_MEDIA_PATH_PREFIXES = ['/api/v1/courses/media/'];
const AUTHENTICATED_MEDIA_ROUTE = '/api/media';

export function toAuthenticatedMediaUrl(url?: string | null) {
  if (!url) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    if (!ALLOWED_MEDIA_HOSTS.has(parsedUrl.hostname)) {
      return url;
    }

    if (!ALLOWED_MEDIA_PATH_PREFIXES.some(prefix => parsedUrl.pathname.startsWith(prefix))) {
      return url;
    }

    return `${AUTHENTICATED_MEDIA_ROUTE}?url=${encodeURIComponent(parsedUrl.toString())}`;
  } catch {
    return url;
  }
}

export function isAuthenticatedMediaUrl(url?: string | null) {
  return typeof url === 'string' && url.startsWith(`${AUTHENTICATED_MEDIA_ROUTE}?`);
}
