import { pathToFileURL } from "node:url";
import { generateText, type LanguageModel } from "ai";
import {
  createOpencode,
  OpencodeModels,
  type OpencodeProvider,
} from "ai-sdk-provider-opencode-sdk";

export const SYSTEM_PROMPT = [
  "You are a copywriter for MyRehat, a Malaysian homestay marketplace.",
  "Polish the raw listing description so it is clear, honest, and inviting.",
  "Keep every factual detail as provided; do not invent facilities or guarantees.",
  "Keep the same language as the input (Bahasa Melayu or English).",
  "Return only the polished description.",
].join("\n");

export type GenerateTextLike = (input: {
  model: LanguageModel;
  system: string;
  prompt: string;
}) => Promise<{ text: string }>;

export async function polishDescription(
  description: string,
  model: LanguageModel,
  generate: GenerateTextLike = generateText,
): Promise<string> {
  if (!description.trim()) {
    throw new Error("Description is required");
  }

  const { text } = await generate({
    model,
    system: SYSTEM_PROMPT,
    prompt: description,
  });

  const polished = text.trim();
  if (!polished) {
    throw new Error("Polished description is empty");
  }

  return polished;
}

export function createProvider(options?: {
  baseUrl?: string;
  password?: string;
}): OpencodeProvider {
  const baseUrl =
    options?.baseUrl ??
    process.env.OPENCODE_BASE_URL ??
    "http://127.0.0.1:4096";
  const password = options?.password ?? process.env.OPENCODE_PASSWORD ?? "";

  if (!password) {
    throw new Error("OPENCODE_PASSWORD is required. Set it first.");
  }

  return createOpencode({
    baseUrl,
    clientOptions: {
      headers: { Authorization: `Basic ${btoa(`opencode:${password}`)}` },
    },
  });
}

async function readStdin(): Promise<string> {
  let input = "";
  for await (const chunk of process.stdin) {
    input += typeof chunk === "string" ? chunk : chunk.toString();
  }
  return input;
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const description = process.argv[2] ?? (await readStdin());

  const provider = createProvider();
  try {
    const model = provider(OpencodeModels["nemotron-3.5-lightning-free"]);
    console.log(await polishDescription(description, model));
  } finally {
    await provider.dispose();
  }
}
