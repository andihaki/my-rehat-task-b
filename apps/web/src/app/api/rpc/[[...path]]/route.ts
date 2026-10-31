import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getServerUrl() {
	const url =
		process.env.SERVER_URL?.trim() ||
		process.env.NEXT_PUBLIC_SERVER_URL?.trim();

	if (!url) {
		return null;
	}

	return url.endsWith("/") ? url.slice(0, -1) : url;
}

type RouteContext = {
	params: Promise<{ path?: string[] }>;
};

async function proxy(request: Request, context: RouteContext) {
	const serverUrl = getServerUrl();

	if (!serverUrl) {
		return NextResponse.json(
			{ error: "SERVER_URL_NOT_CONFIGURED" },
			{ status: 502 },
		);
	}

	const { path = [] } = await context.params;
	const incomingUrl = new URL(request.url);
	const targetUrl = `${serverUrl}/rpc/${path
		.map((segment) => encodeURIComponent(segment))
		.join("/")}${incomingUrl.search}`;

	const headers = new Headers(request.headers);
	headers.delete("host");
	headers.delete("connection");
	headers.delete("content-length");

	const hasBody = request.method !== "GET" && request.method !== "HEAD";

	try {
		const upstream = await fetch(targetUrl, {
			method: request.method,
			headers,
			body: hasBody ? await request.arrayBuffer() : undefined,
			cache: "no-store",
			redirect: "manual",
			signal: AbortSignal.timeout(30_000),
		});

		const responseHeaders = new Headers(upstream.headers);
		responseHeaders.delete("connection");
		responseHeaders.delete("content-encoding");
		responseHeaders.delete("content-length");
		responseHeaders.delete("transfer-encoding");

		return new NextResponse(upstream.body, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers: responseHeaders,
		});
	} catch (error) {
		console.error(
			"[rpc-proxy] upstream request failed:",
			error instanceof Error ? error.message : "unknown error",
		);

		return NextResponse.json(
			{ error: "UPSTREAM_UNAVAILABLE" },
			{ status: 502 },
		);
	}
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
