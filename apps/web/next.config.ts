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
};

export default withVarlock(nextConfig);
