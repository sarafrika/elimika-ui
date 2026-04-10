const COURSE_MEDIA_PATH_PREFIX = '/api/v1/courses/media/';
const PROXY_MEDIA_PATH_PREFIX = '/api/proxy/api/v1/courses/media/';

export function toAuthenticatedMediaUrl(url?: string | null) {
  if (!url) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.pathname.startsWith(COURSE_MEDIA_PATH_PREFIX)) {
      return url;
    }

    return `/api/proxy${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return url;
  }
}

export function isAuthenticatedMediaUrl(url?: string | null) {
  return typeof url === 'string' && url.startsWith(PROXY_MEDIA_PATH_PREFIX);
}
