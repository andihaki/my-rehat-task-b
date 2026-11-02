import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

const SERVER_URL = "https://api.example.test";
const ENDPOINT = `${SERVER_URL}/api/webhooks/waha`;

const validPayload = JSON.stringify({
	event: "message",
	payload: {
		from: "60123456789@c.us",
		body: "Hi, ada homestay kosong di Melaka hujung minggu ini?",
	},
});

function makeRequest(body: string, contentType = "application/json") {
	return new Request("http://localhost:3001/api/webhooks/waha", {
		method: "POST",
		headers: { "content-type": contentType },
		body,
	});
}

function jsonResponse(
	body: unknown,
	status: number,
	contentType = "application/json",
) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": contentType },
	});
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.stubEnv("SERVER_URL", SERVER_URL);
	vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "");
	fetchMock = vi.fn();
	vi.stubGlobal("fetch", fetchMock);
	vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("POST /api/webhooks/waha", () => {
	it("400 for an empty payload", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ error: "INVALID_JSON" }, 400));

		const response = await POST(makeRequest(""));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "INVALID_JSON" });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ body: "" });
	});

	it("400 for an invalid payload", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(
				{ error: "INVALID_PAYLOAD", issues: [{ path: "payload.from" }] },
				400,
			),
		);

		const response = await POST(
			makeRequest(JSON.stringify({ event: "message" })),
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			error: "INVALID_PAYLOAD",
		});
	});

	it("200 for valid payload", async () => {
		const upstreamBody = JSON.stringify({
			to: "60123456789@c.us",
			reply: "Boleh, ada 3 unit kosong. Bila tarikh check-in?",
		});
		fetchMock.mockResolvedValue(
			new Response(upstreamBody, {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const response = await POST(makeRequest(validPayload));

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("application/json");
		expect(await response.text()).toBe(upstreamBody);
	});

	it("200 forwards the raw body verbatim without re-serialising it", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 200));
		const body =
			'{ "event": "message",  "payload": { "from": "a", "body": "b" } }';

		await POST(makeRequest(body));

		expect(fetchMock).toHaveBeenCalledWith(
			ENDPOINT,
			expect.objectContaining({
				method: "POST",
				body,
				cache: "no-store",
				headers: { "content-type": "application/json" },
			}),
		);
	});

	it("200 keeps the request content-type and strips a trailing slash from SERVER_URL", async () => {
		vi.stubEnv("SERVER_URL", `${SERVER_URL}/`);
		fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 200));

		await POST(makeRequest(validPayload, "application/json; charset=utf-8"));

		expect(fetchMock).toHaveBeenCalledWith(
			ENDPOINT,
			expect.objectContaining({
				headers: { "content-type": "application/json; charset=utf-8" },
			}),
		);
	});

	it("502 SERVER_URL_NOT_CONFIGURED without calling upstream when no server URL is set", async () => {
		vi.stubEnv("SERVER_URL", "");
		vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "");

		const response = await POST(makeRequest(validPayload));

		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({
			error: "SERVER_URL_NOT_CONFIGURED",
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("502 UPSTREAM_UNAVAILABLE when the upstream request fails", async () => {
		fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

		const response = await POST(makeRequest(validPayload));

		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({ error: "UPSTREAM_UNAVAILABLE" });
		expect(console.error).toHaveBeenCalled();
	});

	it("200 falls back to NEXT_PUBLIC_SERVER_URL when SERVER_URL is not set", async () => {
		vi.stubEnv("SERVER_URL", "");
		vi.stubEnv("NEXT_PUBLIC_SERVER_URL", SERVER_URL);
		fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 200));

		const response = await POST(makeRequest(validPayload));

		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledWith(ENDPOINT, expect.anything());
	});
});

describe("GET /api/webhooks/waha", () => {
	it("200 for healthcheck only", async () => {
		const response = await GET();

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			status: "ok",
			endpoint: "/api/webhooks/waha",
		});
	});
});
