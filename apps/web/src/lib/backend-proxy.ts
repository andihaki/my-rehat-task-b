import { NextResponse } from "next/server";

export function getBackendUrl() {
	const url =
		process.env.SERVER_URL?.trim() ||
		process.env.NEXT_PUBLIC_SERVER_URL?.trim();

	if (!url) {
		return null;
	}

	return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * Proxy a same-origin request to the Elysia backend using a URL that is read
 * at runtime. This avoids baking an internal Docker hostname into Next rewrites
 * during `next build`.
 */
export async function proxyToBackend(request: Request, pathname: string) {
	const backendUrl = getBackendUrl();

	if (!backendUrl) {
		return NextResponse.json(
			{ error: "SERVER_URL_NOT_CONFIGURED" },
			{ status: 502 },
		);
	}

	const incomingUrl = new URL(request.url);
	const targetUrl = `${backendUrl}${pathname}${incomingUrl.search}`;

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
		const upstreamHeaders = upstream.headers as Headers & {
			getSetCookie?: () => string[];
		};
		const setCookies = upstreamHeaders.getSetCookie?.() ?? [];

		if (setCookies.length > 0) {
			responseHeaders.delete("set-cookie");
			for (const cookie of setCookies) {
				responseHeaders.append("set-cookie", cookie);
			}
		}

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
			"[backend-proxy] upstream request failed:",
			error instanceof Error ? error.message : "unknown error",
		);

		return NextResponse.json(
			{ error: "UPSTREAM_UNAVAILABLE" },
			{ status: 502 },
		);
	}
}
