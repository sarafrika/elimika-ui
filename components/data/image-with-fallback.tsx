'use client';

import Image, { type ImageProps } from 'next/image';
import { type ReactNode, useEffect, useState } from 'react';

type ImageWithFallbackProps = Omit<ImageProps, 'src' | 'onError'> & {
  src?: string | null;
  /** Rendered when there is no src or the image fails to load (e.g. missing media → 404). */
  fallback: ReactNode;
};

/**
 * Renders a next/image that gracefully degrades to `fallback` when the source is
 * missing or fails to load. Many historical course/profile media references point
 * at files that were never persisted, so a hard <img> would render a broken icon
 * and spam 404s — this shows a neutral placeholder instead.
 */
export function ImageWithFallback({ src, fallback, alt, ...props }: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return <>{fallback}</>;
  }

  return <Image src={src} alt={alt} onError={() => setErrored(true)} {...props} />;
}
