import { proxyToBackend } from "@/lib/backend-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
	params: Promise<{ all?: string[] }>;
};

async function handler(request: Request, context: RouteContext) {
	const { all = [] } = await context.params;
	const pathname = `/api/auth/${all
		.map((segment) => encodeURIComponent(segment))
		.join("/")}`;

	return proxyToBackend(request, pathname);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
