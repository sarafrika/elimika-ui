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
  ['/dashboard/instructor/credentials/certificate', '/dashboard/instructor/credentials'],
  ['/dashboard/course-creator/credentials/certificate', '/dashboard/course-creator/credentials'],
  ['/dashboard/student/credentials/certificate', '/dashboard/student/skills-wallet?tab=credentials'],
  ['/dashboard/organisation/account/admin', '/dashboard/organisation/account'],
  ['/dashboard/instructor/trainings', '/dashboard/instructor/classes'],
  ['/dashboard/instructor/trainings/overview', '/dashboard/instructor/classes'],
  ['/dashboard/instructor/trainings/overview/:id', '/dashboard/instructor/classes/overview/:id'],
  ['/dashboard/instructor/trainings/create-new', '/dashboard/instructor/classes/new'],
  ['/dashboard/instructor/trainings/instructor-console/:id', '/dashboard/instructor/classes/class-training/:id'],
  ['/dashboard/instructor/trainings/students', '/dashboard/instructor/students'],
  ['/dashboard/instructor/trainings/timetable', '/dashboard/instructor/calendar'],
  ['/dashboard/instructor/learning/:path*', '/dashboard/instructor/courses'],
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
  // Retired duplicate routes: one implementation per role, old URLs and bookmarks still resolve.
  async redirects() {
    const learnerRoles = ['student', 'course-creator', 'parent'];
    return [
      { source: '/cart', destination: '/dashboard/cart', permanent: false },
      ...learnerRoles.flatMap(role => [
        {
          source: `/dashboard/${role}/all-courses/:path*`,
          destination: `/dashboard/${role}/courses/:path*`,
          permanent: false,
        },
        {
          source: `/dashboard/${role}/messaging-notifications`,
          destination: `/dashboard/${role}/notifications`,
          permanent: false,
        },
      ]),
      {
        source: '/dashboard/course-creator/course-management/preview/:id',
        destination: '/dashboard/course-creator/courses/:id',
        permanent: false,
      },
      {
        source: '/dashboard/course-creator/course-management/programs/:id',
        destination: '/dashboard/course-creator/programs/:id',
        permanent: false,
      },
      {
        source: '/dashboard/instructor/my-courses/:id',
        destination: '/dashboard/instructor/courses/:id',
        permanent: false,
      },
    ];
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
