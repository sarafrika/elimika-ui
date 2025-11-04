import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    domains: ['api.elimika.sarafrika.com', 'cdn.sarafrika.com', 'images.unsplash.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
