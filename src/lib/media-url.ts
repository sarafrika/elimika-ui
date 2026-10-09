const ALLOWED_MEDIA_HOSTS = new Set([
  'api.elimika.sarafrika.com',
  'api.elimika.staging.sarafrika.com',
]);

const ALLOWED_MEDIA_PATH_PREFIXES = ['/api/v1', '/api/v1'];
const AUTHENTICATED_MEDIA_ROUTE = '/api';
const PROXY_MEDIA_ROUTE = '/api/proxy';
// Some endpoints return a bare storage key (`course_thumbnails/x.jpeg`) instead of a URL.
const BARE_STORAGE_KEY_PATTERN =
  /^(course_thumbnails|course_banners|course_intro_videos|class_thumbnails|class_promotional_videos|profile_images|program_[a-z_]+)\//;

function isAllowedMediaPath(pathname: string) {
  return ALLOWED_MEDIA_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function toProxyMediaUrl(pathname: string) {
  return `${PROXY_MEDIA_ROUTE}${pathname}`;
}

export function toAuthenticatedMediaUrl(url?: string | null | undefined) {
  if (!url) {
    return url;
  }

  if (BARE_STORAGE_KEY_PATTERN.test(url)) {
    return `${PROXY_MEDIA_ROUTE}/api/v1/files/${url}`;
  }

  if (url.startsWith('/')) {
    if (!isAllowedMediaPath(url)) {
      return url;
    }

    return url.startsWith('/api/v1/') ? toProxyMediaUrl(url) : url;
  }

  try {
    const parsedUrl = new URL(url);
    if (!ALLOWED_MEDIA_HOSTS.has(parsedUrl.hostname)) {
      return url;
    }

    if (!isAllowedMediaPath(parsedUrl.pathname)) {
      return url;
    }

    if (parsedUrl.pathname.startsWith('/api/v1')) {
      return toProxyMediaUrl(`${parsedUrl.pathname}${parsedUrl.search}`);
    }

    return `${AUTHENTICATED_MEDIA_ROUTE}?url=${encodeURIComponent(parsedUrl.toString())}`;
  } catch {
    return url;
  }
}

// export function isAuthenticatedMediaUrl(url?: string | null) {
//   return typeof url === 'string' && url.startsWith(`${AUTHENTICATED_MEDIA_ROUTE}?`);
// }

export function isAuthenticatedMediaUrl(url?: string | null) {
  return typeof url === 'string' && (url.startsWith('/api?') || url.startsWith('/api/proxy/'));
}
