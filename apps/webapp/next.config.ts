import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  allowedDevOrigins: ['app.local.first2apply.com'],
};

export default nextConfig;
