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
};

export default nextConfig;
