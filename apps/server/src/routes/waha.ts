import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { Elysia } from "elysia";
import { z } from "zod";

import { ENV } from "../env.server";

globalThis.AI_SDK_DEFAULT_PROVIDER = createOpenRouter({
	apiKey: ENV.OPENROUTER_API_KEY,
	compatibility: "strict",
});

const wahaWebhookSchema = z.object({
	event: z.string().trim().min(1),
	payload: z.object({
		from: z.string().trim().min(1).max(120),
		body: z.string().trim().min(1).max(4000),
	}),
});

const CONCIERGE_SYSTEM_PROMPT = `
You are MyRehat Concierge, a helpful WhatsApp assistant for homestay enquiries in Malaysia.
Reply in the same language the user uses (Bahasa Melayu or English).
Keep replies short and WhatsApp-friendly, ideally under 120 words.
Ask for the missing details needed to help: location, check-in/check-out dates, number of guests,
and budget.
Never invent listing availability, exact prices, or booking confirmations.
If the user asks for something you cannot verify, say so and offer to connect them with the host.
`.trim();

export const wahaWebhook = new Elysia().post(
	"/api/webhooks/waha",
	async ({ request, set }) => {
		let json: unknown;
		try {
			json = await request.json();
		} catch {
			set.status = 400;
			return { error: "INVALID_JSON" };
		}

		const parsed = wahaWebhookSchema.safeParse(json);
		if (!parsed.success) {
			set.status = 400;
			return {
				error: "INVALID_PAYLOAD",
				issues: parsed.error.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
				})),
			};
		}

		const { event, payload } = parsed.data;

		if (event !== "message") {
			return { ignored: true };
		}

		try {
			const { text } = await generateText({
				model: ENV.OPENROUTER_MODEL,
				system: CONCIERGE_SYSTEM_PROMPT,
				prompt: payload.body,
				temperature: 0.3,
				maxOutputTokens: 400,
				abortSignal: AbortSignal.timeout(20_000),
			});

			const reply = text.trim();
			if (!reply) {
				set.status = 502;
				return { error: "EMPTY_AI_REPLY" };
			}

			return { to: payload.from, reply };
		} catch (error) {
			console.error(
				"[waha] generateText failed:",
				error instanceof Error ? error.message : "unknown error",
			);
			set.status = 502;
			return { error: "AI_GENERATION_FAILED" };
		}
	},
	{ parse: "none" },
);
