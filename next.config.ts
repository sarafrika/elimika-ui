// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
import type { NextConfig } from 'next';

const parseRemotePattern = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
    };
  } catch {
    return null;
  }
};

const imageHostCandidates = [
  'https://api.elimika.sarafrika.com',
  'https://api.elimika.staging.sarafrika.com',
  'https://cdn.sarafrika.com',
  process.env.API_BASE_URL,
  process.env.NEXT_PUBLIC_API_URL,
].filter((value): value is string => Boolean(value));

const remotePatterns = Array.from(
  new Map(
    imageHostCandidates
      .map(candidate => {
        const pattern = parseRemotePattern(candidate);
        if (!pattern) {
          return null;
        }
        const key = `${pattern.protocol}://${pattern.hostname}:${pattern.port ?? ''}`;
        return [key, pattern] as const;
      })
      .filter(
        (
          entry
        ): entry is readonly [string, { protocol: string; hostname: string; port?: string }] =>
          Boolean(entry)
      )
      .map(([key, pattern]) => [key, pattern])
  ).values()
);

const removedDashboardRoutes: Array<[string, string]> = [
  ['/dashboard/student/contacts/:path*', '/dashboard/student/overview'],
  ['/dashboard/student/communities', '/dashboard/student/overview'],
  ['/dashboard/student/library', '/dashboard/student/overview'],
  ['/dashboard/student/assessment/exams', '/dashboard/student/assessment'],
  ['/dashboard/student/assessment/quizzes', '/dashboard/student/assessment'],
  ['/dashboard/instructor/library', '/dashboard/instructor/overview'],
  ['/dashboard/instructor/communities', '/dashboard/instructor/overview'],
  ['/dashboard/course-creator/library', '/dashboard/course-creator/overview'],
  ['/dashboard/instructor/portfolio/:projectId', '/dashboard/instructor/portfolio'],
];

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ['undici'],
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    // /api/proxy runs through proxy.ts, which clones request bodies up to this cap (default 10mb).
    proxyClientMaxBodySize: '100mb',
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  images: {
    remotePatterns,
    // Proxied API media is optimised (AVIF/WebP at rendered width); query strings allowed there only.
    localPatterns: [{ pathname: '/api/proxy/api/v1/**' }, { pathname: '/**', search: '' }],
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // /public files are not content-hashed: cache a day, revalidate in the background for a week.
  async headers() {
    const publicAssetCache = [
      { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
    ];
    return ['/logos/:path*', '/assets/:path*'].map(source => ({
      source,
      headers: publicAssetCache,
    }));
  },
  // Placeholder and legacy dashboard pages were deleted; old bookmarks land somewhere real.
  async redirects() {
    return removedDashboardRoutes.map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
