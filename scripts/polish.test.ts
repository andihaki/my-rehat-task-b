import { describe, expect, it, mock } from "bun:test";
import type { LanguageModel } from "ai";

import {
	createProvider,
	type GenerateTextLike,
	polishDescription,
	SYSTEM_PROMPT,
} from "./polish";

const model = {} as unknown as LanguageModel;

describe("polish listing description", () => {
	it("returns the polished description from a mocked generateText", async () => {
		let received: { system: string; prompt: string } | undefined;
		const generate = mock<GenerateTextLike>(async (input) => {
			received = input;
			return { text: "  Polished description  " };
		});

		const result = await polishDescription(
			"nice homestay near beach, 3 rooms 2 bath",
			model,
			generate,
		);

		expect(result).toBe("Polished description");
		expect(received?.system).toBe(SYSTEM_PROMPT);
		expect(received?.prompt).toBe("nice homestay near beach, 3 rooms 2 bath");
		expect(generate).toHaveBeenCalledTimes(1);
	});

	it("throws when the model returns empty text", async () => {
		const generate = async () => ({ text: "   " });

		await expect(
			polishDescription("raw description", model, generate),
		).rejects.toThrow("Polished description is empty");
	});

	it("creates an OpenCode provider without contacting the server", () => {
		const provider = createProvider({
			baseUrl: "http://127.0.0.1:4096",
			password: "test",
		});

		expect(typeof provider).toBe("function");
		expect(provider("opencode/big-pickle")).toBeTypeOf("object");
	});

	it("throws when the OpenCode password is empty", () => {
		expect(() =>
			createProvider({ baseUrl: "http://127.0.0.1:4096", password: "" }),
		).toThrow("OPENCODE_PASSWORD is required. Set it first.");
	});
});
