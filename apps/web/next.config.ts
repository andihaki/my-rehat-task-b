import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";
import type { NextConfig } from "next";

const withVarlock = varlockNextConfigPlugin();

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  output: "standalone",
  transpilePackages: ["shiki"],
  async redirects() {
    return [
      {
        source: "/buy-homestay",
        destination: "/listings",
        permanent: true,
      },
      {
        source: "/buy-homestay/:path*",
        destination: "/listings/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const serverUrl = process.env.SERVER_URL || "http://server:3000";
    return [
      {
        source: "/rpc/:path*",
        destination: `${serverUrl}/rpc/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${serverUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default withVarlock(nextConfig);
