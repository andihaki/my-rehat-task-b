import { NextResponse } from "next/server";

// WAHA callbacks must always hit the live Elysia server, never a cached response.
export const dynamic = "force-dynamic";

function getServerUrl() {
	const url =
		process.env.SERVER_URL?.trim() ||
		process.env.NEXT_PUBLIC_SERVER_URL?.trim();

	if (!url) {
		return null;
	}

	return url.endsWith("/") ? url.slice(0, -1) : url;
}

export async function POST(request: Request) {
	const serverUrl = getServerUrl();

	if (!serverUrl) {
		return NextResponse.json(
			{ error: "SERVER_URL_NOT_CONFIGURED" },
			{ status: 502 },
		);
	}

	const body = await request.text();

	try {
		const upstream = await fetch(`${serverUrl}/api/webhooks/waha`, {
			method: "POST",
			headers: {
				"content-type":
					request.headers.get("content-type") ?? "application/json",
			},
			body,
			cache: "no-store",
			signal: AbortSignal.timeout(30_000),
		});

		return new NextResponse(await upstream.text(), {
			status: upstream.status,
			headers: {
				"content-type":
					upstream.headers.get("content-type") ?? "application/json",
			},
		});
	} catch (error) {
		console.error(
			"[waha-web] upstream request failed:",
			error instanceof Error ? error.message : "unknown error",
		);

		return NextResponse.json(
			{ error: "UPSTREAM_UNAVAILABLE" },
			{ status: 502 },
		);
	}
}

export async function GET() {
	return NextResponse.json({
		status: "ok",
		endpoint: "/api/webhooks/waha",
	});
}
