import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '4000' }],
  },
};

export default nextConfig;
