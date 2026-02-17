import type { NextConfig } from 'next';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error('Environment variable NEXT_PUBLIC_API_URL is not defined.');
}

const parsedApiUrl = new URL(apiBaseUrl);
const apiPattern = {
  protocol: parsedApiUrl.protocol.replace(':', ''),
  hostname: parsedApiUrl.hostname,
  ...(parsedApiUrl.port ? { port: parsedApiUrl.port } : {}),
};

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns: [apiPattern],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
