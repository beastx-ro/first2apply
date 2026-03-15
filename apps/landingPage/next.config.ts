import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ['@first2apply/ui'],
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;
