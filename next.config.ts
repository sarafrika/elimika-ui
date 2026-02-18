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

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
