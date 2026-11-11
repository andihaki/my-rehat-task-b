import { varlockNextConfigPlugin } from '@varlock/nextjs-integration/plugin';
import type { NextConfig } from 'next';

const withVarlock = varlockNextConfigPlugin();

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  output: 'standalone',
  transpilePackages: ['shiki'],
  async redirects() {
    return [
      {
        source: '/buy-homestay',
        destination: '/listings',
        permanent: true,
      },
      {
        source: '/buy-homestay/:path*',
        destination: '/listings/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // The backend address is stable across every Docker deployment
    // (local compose and Dokploy both run `server` on the same network),
    // so it can be frozen at build time. Bare-metal `pnpm dev` sets
    // SERVER_URL=http://localhost:3000 in apps/web/.env.local instead.
    const serverUrl = process.env.SERVER_URL || 'http://server:3000';
    return [
      {
        source: '/api/auth/:path*',
        destination: `${serverUrl}/api/auth/:path*`,
      },
      {
        source: '/api/rpc/:path*',
        destination: `${serverUrl}/rpc/:path*`,
      },
    ];
  },
};

export default withVarlock(nextConfig);
