'use client';

import { isAuthenticatedMediaUrl } from '@/src/lib/media-url';
import Image, { type ImageProps } from 'next/image';
import { type ReactNode, useEffect, useState, useSyncExternalStore } from 'react';

type ImageWithFallbackProps = Omit<ImageProps, 'src' | 'onError'> & {
  src?: string | null;
  /** Rendered when there is no src or the image fails to load (e.g. missing media → 404). */
  fallback: ReactNode;
};

const MISSING_MEDIA_KEY = 'elimika:media-missing';
let missingMedia: Set<string> | null = null;

// Per-tab negative cache: a src that failed once is never requested again this session.
function getMissingMedia() {
  if (missingMedia) return missingMedia;
  missingMedia = new Set();
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(MISSING_MEDIA_KEY) ?? '[]');
    if (Array.isArray(stored)) {
      for (const value of stored) {
        if (typeof value === 'string') missingMedia.add(value);
      }
    }
  } catch {
    // Storage blocked or corrupt: the in-memory set still covers this tab.
  }
  return missingMedia;
}

function markMissing(src: string) {
  const set = getMissingMedia();
  set.add(src);
  try {
    window.sessionStorage.setItem(MISSING_MEDIA_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Storage blocked or full: the in-memory set still covers this tab.
  }
}

const noopSubscribe = () => () => undefined;

/**
 * Renders a next/image that degrades to `fallback` when the source is missing or fails
 * to load (many historical media references were never persisted). Known-missing
 * sources render the fallback at once, so the browser skips the request.
 */
export function ImageWithFallback({ src, fallback, alt, ...props }: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false);
  const knownMissing = useSyncExternalStore(
    noopSubscribe,
    () => (src ? getMissingMedia().has(src) : false),
    () => false
  );

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored || knownMissing) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={() => {
        markMissing(src);
        setErrored(true);
      }}
      {...props}
      unoptimized={isAuthenticatedMediaUrl(src) || props.unoptimized}
    />
  );
}
