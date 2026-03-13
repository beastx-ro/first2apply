import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ['app.local.first2apply.com', 'dragos.beastx.ro'],
};

export default nextConfig;
