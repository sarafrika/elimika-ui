import type { Metadata } from 'next';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const getValidSiteUrl = (value?: string) => {
  const normalizedValue = value?.trim().replace(/\/$/, '');
  if (!normalizedValue || /^__.+__$/.test(normalizedValue)) {
    return undefined;
  }

  try {
    const url = new URL(normalizedValue);
    return /^https?:$/.test(url.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
};

const configuredSiteUrl = getValidSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
const apiUrl = getValidSiteUrl(process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL);
// Canonical pages and the media proxy are served by the frontend, not the API host.
const metadataBase =
  (configuredSiteUrl?.origin !== apiUrl?.origin ? configuredSiteUrl : undefined) ??
  getValidSiteUrl(process.env.AUTH_URL) ??
  new URL(`http://127.0.0.1:${process.env.PORT ?? '3000'}`);

function previewImageUrl(image?: string | null) {
  const mediaUrl = toAuthenticatedMediaUrl(image);
  if (!mediaUrl) return undefined;
  try {
    const url = new URL(mediaUrl, metadataBase);
    return /^https?:$/.test(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export const absoluteSiteUrl = (path: string) => new URL(path, metadataBase).toString();

const fallbackImage = {
  url: absoluteSiteUrl('/opengraph-image'),
  width: 1200,
  height: 630,
  alt: 'Elimika — Empowering growth through structural online learning.',
  type: 'image/png',
};

const defaultSeoDescription =
  'Elimika helps learners, instructors, course creators, and organisations discover courses, build skills wallets, and manage modern learning journeys.';

export const siteMetadata: Metadata = {
  metadataBase,
  applicationName: 'Elimika',
  title: {
    default: 'Elimika',
    template: '%s | Elimika',
  },
  description: defaultSeoDescription,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Elimika',
    title: 'Elimika',
    description: defaultSeoDescription,
    url: absoluteSiteUrl('/'),
    images: [fallbackImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elimika',
    description: defaultSeoDescription,
    images: [fallbackImage],
  },
};

type CreatePageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string | { url: string; width: number; height: number; type?: string } | null;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  image,
  noIndex = false,
}: CreatePageMetadataOptions): Metadata {
  const imageUrl = typeof image === 'string' ? image.trim() : image?.url;
  const previewUrl = previewImageUrl(imageUrl);
  // Uploaded thumbnails have their own dimensions and format; do not label them as our PNG card.
  const previewImage = previewUrl
    ? { ...(typeof image === 'object' ? image : {}), url: previewUrl, alt: title }
    : fallbackImage;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: absoluteSiteUrl(path),
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      type: 'website',
      siteName: 'Elimika',
      title,
      description,
      url: absoluteSiteUrl(path),
      images: [previewImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [previewImage],
    },
  };
}
