import { proxyToBackend } from "@/lib/backend-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path?: string[] }> };

function toBackendPath(path: string[] | undefined): string {
	const suffix = path?.length ? `/${path.join("/")}` : "";
	return `/rpc${suffix}`;
}

export async function GET(request: Request, context: RouteContext) {
	const { path } = await context.params;
	return proxyToBackend(request, toBackendPath(path));
}

export async function POST(request: Request, context: RouteContext) {
	const { path } = await context.params;
	return proxyToBackend(request, toBackendPath(path));
}
