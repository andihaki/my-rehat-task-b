# Task Spec: F2 Chat Concierge Webhook (MyRehat.com Take-Home Test)

> **Audience:** an LLM coding agent. Execute the phases in order. Follow the constraints exactly.
> Do not add features that are not listed.

## 1. Objective

Add a **stateless WhatsApp webhook** to the existing Elysia API:

1. Expose `POST /api/webhooks/waha`.
2. Accept the WAHA-shaped payload `{ event, payload: { from, body } }`.
3. Validate the payload with Zod.
4. Generate a reply with the AI SDK's `generateText`.
5. Return JSON `{ to, reply }`.

**No WhatsApp / live phone connection is required.** The deliverable is the endpoint and its
payload/response contract, verified with `curl` or an HTTP client.

## 2. Scope

### In scope

- One new POST route in `apps/server`.
- Zod request validation.
- One AI SDK `generateText` call.
- JSON response containing the original sender as `to` and the AI text as `reply`.
- Error responses for invalid input and AI failures.
- Manual verification commands.

### Out of scope (must not be added)

- Sending messages back through WAHA or any WhatsApp API.
- WAHA session management, QR login, or live phone testing.
- Database writes, conversation history, or message persistence.
- Chat UI, streaming responses, media/audio handling, or typing indicators.
- Auth/session checks on the webhook (WAHA cannot send a Better-Auth session).
- New dependencies, new database tables, or migrations.

## 3. Fixed Tech Stack

| Concern        | Choice                                                          |
| -------------- | --------------------------------------------------------------- |
| HTTP server    | Existing Elysia server at `apps/server` (port `3000`)           |
| Validation     | `zod` (already installed)                                       |
| AI SDK         | `ai` → `generateText`                                           |
| Model provider | `@ai-sdk/google` → `google("gemini-3.1-flash-lite")` |
| API key        | Existing `GOOGLE_GENERATIVE_AI_API_KEY` from `apps/server/.env` |
| Runtime        | Bun (existing `pnpm dev:server`)                                |

No new packages are needed.

## 4. Hard Constraints (must not be violated)

1. **Endpoint is exactly `POST /api/webhooks/waha` on the Elysia server** (`http://localhost:3000`).
   Do **not** create a Next.js route for this feature.
2. **Request body is exactly the WAHA shape.** Extra WAHA fields may be ignored, but these fields
   are required:
   ```json
   {
     "event": "message",
     "payload": {
       "from": "60123456789@c.us",
       "body": "Hi, nak cari homestay di Langkawi"
     }
   }
   ```
3. **Validate before calling the AI.** Invalid payloads must return `400` and must **not** call
   `generateText`.
4. **Successful response for a message event is exactly `{ to, reply }`.**
   - `to` is the original `payload.from` value, unchanged (for example `60123456789@c.us`).
   - `reply` is the trimmed `generateText` output.
5. **Use `generateText`, not `streamText`.** The webhook must return a complete JSON response.
6. **No outbound WhatsApp request is made.** The route only reads the request and returns JSON.
7. **No database access.** The handler must not import or use `db`.
8. **No secrets in the response or logs.** Never return provider errors or API keys to the caller.
9. **Do not add the webhook secret/auth layer** unless explicitly requested later. WAHA is not
   connected in this task, so the contract is validated by payload shape only.
10. `pnpm check-types` must pass, and the new webhook file must pass `biome check`.
    Repo-wide `pnpm check` currently reports pre-existing formatting issues in unrelated files.

## 5. Endpoint Contract

### Request

```http
POST /api/webhooks/waha
Content-Type: application/json
```

```json
{
  "event": "message",
  "payload": {
    "from": "60123456789@c.us",
    "body": "Hi, ada homestay dekat Langkawi?"
  }
}
```

### Success response (`200`)

```json
{
  "to": "60123456789@c.us",
  "reply": "Hai! Boleh beritahu tarikh check-in, bilangan tetamu, dan bajet anda?"
}
```

### Non-message event (`200`)

WAHA can post other events (for example `session.status`). Acknowledge them without calling the AI,
so WAHA does not retry:

```json
{
  "ignored": true
}
```

### Error responses

| Case                           | Status | Body                                              |
| ------------------------------ | ------ | ------------------------------------------------- |
| Body is not valid JSON         | `400`  | `{ "error": "INVALID_JSON" }`                     |
| Missing/blank/oversized fields | `400`  | `{ "error": "INVALID_PAYLOAD", "issues": [...] }` |
| AI throws                      | `502`  | `{ "error": "AI_GENERATION_FAILED" }`             |
| AI returns empty text          | `502`  | `{ "error": "EMPTY_AI_REPLY" }`                   |

`issues` format:

```json
[
  {
    "path": "payload.body",
    "message": "Too small: expected string to have >=1 characters"
  }
]
```

## 6. Validation Rules

Create a Zod schema in the webhook module:

```ts
const wahaWebhookSchema = z.object({
  event: z.string().trim().min(1),
  payload: z.object({
    from: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(4000),
  }),
});
```

Rules:

- `event` must be a non-empty string.
- Only `event === "message"` triggers AI generation.
- `payload.from` must be a non-empty string, max 120 chars.
  - Keep the raw value, including the `@c.us` suffix. Do not strip or re-normalize it.
- `payload.body` must be a non-empty string after trimming, max 4000 chars.
- Unknown fields are allowed and ignored (Zod's default object behavior).
- Whitespace-only `body` is invalid.
- Parse errors must produce a deterministic `400` response, not an unhandled exception.

## 7. Code Structure

Add one module and register it in the existing server entrypoint:

```
apps/server/src/
├── index.ts              # add import + .use(wahaWebhook)
└── routes/
    └── waha.ts           # schema, prompt, generateText handler
```

No changes to `apps/web`, `packages/db`, or `packages/api`.

### `apps/server/src/routes/waha.ts` (shape)

```ts
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { Elysia } from "elysia";
import { z } from "zod";

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
        model: google("gemini-3.1-flash-lite"),
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
```

Notes:

- `{ parse: "none" }` prevents Elysia from consuming the request body before `request.json()`.
- Do not use `streamText`, `toUIMessageStream`, or `createUIMessageStreamResponse`.
- Do not use `wrapLanguageModel`/`devToolsMiddleware` for this route; keep the webhook response simple.
- Logging only the error message (not the full provider payload) keeps secrets and user content out of
  logs.

### Register the route in `apps/server/src/index.ts`

Add the import:

```ts
import { wahaWebhook } from "./routes/waha";
```

Add `.use(wahaWebhook)` before `.listen(...)`:

```ts
new Elysia()
  .use(
    cors({
      /* existing config */
    }),
  )
  .all("/api/auth/*" /* existing */)
  .all("/rpc*" /* existing */)
  .all("/api-reference*" /* existing */)
  .post("/ai" /* existing */)
  .use(wahaWebhook)
  .get("/", () => "OK")
  .listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
```

## 8. Task List

Mark each item `[x]` when done. Do not skip ahead.

### Phase 0: Inspect existing server

- [x] Confirm the server is Elysia in `apps/server/src/index.ts` and listens on port `3000`.
- [x] Confirm `ai`, `@ai-sdk/google`, and `zod` are already dependencies.
- [x] Confirm `GOOGLE_GENERATIVE_AI_API_KEY` exists in `apps/server/.env.schema` and is loaded by
      `apps/server/src/env.server.ts`.
- [x] Confirm the webhook should be added to `apps/server`, not `apps/web`.

### Phase 1: Webhook module

- [x] Create `apps/server/src/routes/waha.ts`.
- [x] Add `wahaWebhookSchema` with the validation rules from section 6.
- [x] Add `CONCIERGE_SYSTEM_PROMPT` for MyRehat homestay enquiries.
- [x] Implement the POST handler:
  1. Parse JSON safely; return `400 INVALID_JSON` on failure.
  2. Validate with `safeParse`; return `400 INVALID_PAYLOAD` with mapped issues on failure.
  3. Return `200 { ignored: true }` when `event !== "message"`.
  4. Call `generateText` with the model, system prompt, and `payload.body`.
  5. Trim the result; return `502 EMPTY_AI_REPLY` if empty.
  6. Return `200 { to: payload.from, reply }`.
  7. Catch AI errors; log only a safe message and return `502 AI_GENERATION_FAILED`.
- [x] Use `{ parse: "none" }` on the route.
- [x] Do not reference the database or make any outbound WhatsApp request.

### Phase 2: Wire into the server

- [x] Import `wahaWebhook` in `apps/server/src/index.ts`.
- [x] Add `.use(wahaWebhook)` before `.listen(...)`.
- [x] Verify the route path resolves to exactly `/api/webhooks/waha`.

### Phase 3: Local verification (no WAHA needed)

- [x] Start the server: `pnpm dev:server`.
- [x] Send a valid message payload with `curl`; verify `200` and `{ to, reply }`.
- [x] Verify `to` exactly equals the request's `payload.from`.
- [x] Verify `reply` is a non-empty string generated by the AI.
- [x] Send a non-message event; verify `200 { "ignored": true }` and no AI call.
- [x] Send malformed JSON; verify `400 INVALID_JSON`.
- [x] Send a payload with missing `payload.from`; verify `400 INVALID_PAYLOAD` with issues.
- [x] Send a payload with an empty/whitespace `payload.body`; verify `400 INVALID_PAYLOAD`.
- [x] Confirm no database writes occur (code review: `waha.ts` must not import `db`).
- [x] Confirm no WAHA/WhatsApp send call exists (code review: no `fetch` to WAHA, no WA client).

### Phase 4: Quality gates

- [x] Run `pnpm check-types`.
- [x] Run `pnpm exec biome check apps/server/src/routes/waha.ts`.
- [x] Fix any formatting/type errors in the new files.
- [x] Do not commit `.env`, API keys, or generated secrets.

## 9. Verification Commands

Start the server:

```bash
pnpm dev:server
```

### Happy path

```bash
curl -sS -i -X POST http://localhost:3000/api/webhooks/waha \
  -H 'Content-Type: application/json' \
  --data '{
    "event": "message",
    "payload": {
      "from": "60123456789@c.us",
      "body": "Hi, nak cari homestay dekat Langkawi untuk 2 malam"
    }
  }'
```

Expected status: `200`

Expected shape:

```json
{
  "to": "60123456789@c.us",
  "reply": "<non-empty AI reply>"
}
```

### Non-message event

```bash
curl -sS -i -X POST http://localhost:3000/api/webhooks/waha \
  -H 'Content-Type: application/json' \
  --data '{"event":"session.status","payload":{"from":"60123456789@c.us","body":"ignored"}}'
```

Expected status: `200`

```json
{ "ignored": true }
```

### Invalid JSON

```bash
curl -sS -i -X POST http://localhost:3000/api/webhooks/waha \
  -H 'Content-Type: application/json' \
  --data 'not-json'
```

Expected status: `400`

```json
{ "error": "INVALID_JSON" }
```

### Missing field

```bash
curl -sS -i -X POST http://localhost:3000/api/webhooks/waha \
  -H 'Content-Type: application/json' \
  --data '{"event":"message","payload":{"body":"Hello"}}'
```

Expected status: `400`

```json
{
  "error": "INVALID_PAYLOAD",
  "issues": [{ "path": "payload.from", "message": "..." }]
}
```

### Empty body

```bash
curl -sS -i -X POST http://localhost:3000/api/webhooks/waha \
  -H 'Content-Type: application/json' \
  --data '{"event":"message","payload":{"from":"60123456789@c.us","body":"   "}}'
```

Expected status: `400 INVALID_PAYLOAD`.

## 10. Acceptance Criteria

- [x] `POST /api/webhooks/waha` exists on the Elysia server.
- [x] A valid `message` payload returns `200` with exactly the keys `to` and `reply`.
- [x] `to` equals the original `payload.from` (including `@c.us`).
- [x] Invalid payloads return `400` and never call `generateText`.
- [x] Non-message events return `200 { "ignored": true }` without calling `generateText`.
- [x] AI failures return `502` without leaking provider details.
- [x] No WhatsApp message is sent; no WAHA API call is made.
- [x] No database reads/writes or migrations are added.
- [x] No new dependencies are added.
- [x] `pnpm check-types` passes.
- [x] Targeted `biome check` on the new webhook file passes. Repo-wide `pnpm check` still reports pre-existing issues in unrelated files.

## 11. Definition of Done

The feature is done when a reviewer can start the server, run the happy-path `curl` command, and see:

```json
{
  "to": "60123456789@c.us",
  "reply": "..."
}
```

The reviewer can also confirm by code inspection that the endpoint validates the WAHA payload,
uses `generateText`, and never talks to WhatsApp or the database.
