import type { Metadata } from 'next';

const getValidSiteUrl = (value?: string) => {
  const normalizedValue = value?.trim().replace(/\/$/, '');
  if (!normalizedValue || /^__.+__$/.test(normalizedValue)) {
    return undefined;
  }

  try {
    return new URL(normalizedValue);
  } catch {
    return undefined;
  }
};

const metadataBase =
  getValidSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  new URL(`http://127.0.0.1:${process.env.PORT ?? '3000'}`);

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
  image?: string | null;
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
  const previewImage = image
    ? { ...fallbackImage, url: absoluteSiteUrl(image), alt: title }
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
