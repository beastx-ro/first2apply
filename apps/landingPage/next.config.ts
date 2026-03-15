import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    esmExternals: 'loose',
  },
  allowedDevOrigins: ['app.local.first2apply.com', 'dragos.beastx.ro'],
};

export default nextConfig;
