import type { Metadata } from 'next';

const siteOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.AUTH_URL ??
  `http://127.0.0.1:${process.env.PORT ?? '3000'}`;

export const metadataBase = new URL(siteOrigin);

export const defaultSeoDescription =
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
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elimika',
    description: defaultSeoDescription,
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
  const openGraphImages = image ? [{ url: image }] : undefined;
  const twitterCard = image ? 'summary_large_image' : 'summary';

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
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
      url: path,
      images: openGraphImages,
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
