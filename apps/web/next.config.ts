import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";

const withVarlock = varlockNextConfigPlugin();

import type { NextConfig } from "next";

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
};

export default withVarlock(nextConfig);
