const COURSE_MEDIA_PATH_PREFIX = '/api/v1/courses/media/';

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
