import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";
import type { NextConfig } from "next";

const withVarlock = varlockNextConfigPlugin();

const backendUrl = (
	process.env.SERVER_URL ||
	process.env.NEXT_PUBLIC_SERVER_URL ||
	"http://server:3000"
).replace(/\/$/, "");

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
		return [
			{
				source: "/rpc/:path*",
				destination: `${backendUrl}/rpc/:path*`,
			},
			{
				source: "/api/auth/:path*",
				destination: `${backendUrl}/api/auth/:path*`,
			},
			{
				source: "/api/ai",
				destination: `${backendUrl}/ai`,
			},
		];
	},
};

export default withVarlock(nextConfig);
