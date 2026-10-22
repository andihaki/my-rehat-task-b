# Task Spec: BuyHomestay Listing Feature (MyRehat.com Take-Home Test)

> **Audience:** an LLM coding agent. Execute the phases in order. Follow the constraints exactly. Do not add features that are not listed.

## 1. Objective

Build a small end-to-end feature in a **Next.js (App Router, TypeScript)** app:

1. A **public** page at `/buy-homestay` that lists all BuyHomestay listings (view only).
2. A **private** form to create a listing. Only a **logged-in user (Better-Auth)** may submit.
3. Listings are stored with **Drizzle ORM**.

## 2. Tech Stack (fixed)

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth | Better-Auth (email + password) |
| ORM | Drizzle ORM + drizzle-kit |
| Validation | Zod |
| Database | Postgres (Neon/Supabase) or SQLite. Pick one, document it in the README |

## 3. Hard Constraints (must not be violated)

1. **Page URL is `/buy-homestay`.** It is **public** (no login needed to view).
2. The **call-to-action (CTA) button** ("Post Listing") is **private**: only usable by logged-in users. Unauthenticated users are sent to `/login`.
3. **Authorization is enforced on the server** (Server Action or Route Handler). Hiding UI is not sufficient.
4. The listing **type dropdown has EXACTLY 4 options** (see section 4). No extra options, no "Other". A placeholder is allowed only if it is `disabled` and not a valid value.
5. The type value is **validated on the server** with `z.enum`, and stored with a DB enum.
6. The list is **view only**. No edit, no delete, no update endpoints.
7. **Currency is RM (MYR, Malaysia).** Display with `Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" })`.
8. `userId` is taken from the **session**, never from form input.
9. Do not commit secrets. Provide `.env.example`.

## 4. Fixed Listing Types (single source of truth)

Define once in `src/lib/constants.ts` and reuse in Zod, Drizzle enum, and the dropdown.

| Value (stored) | Label (shown in UI, exact text) |
|---|---|
| `buy_property` | Buy Property |
| `buy_land` | Buy land to build homestay |
| `buy_airbnb_profile` | Buy Airbnb Profile |
| `buy_airbnb_business` | Buy Airbnb Business |

```ts
// src/lib/constants.ts
export const LISTING_TYPES = [
  { value: "buy_property", label: "Buy Property" },
  { value: "buy_land", label: "Buy land to build homestay" },
  { value: "buy_airbnb_profile", label: "Buy Airbnb Profile" },
  { value: "buy_airbnb_business", label: "Buy Airbnb Business" },
] as const;

export const LISTING_TYPE_VALUES = LISTING_TYPES.map((t) => t.value) as [
  (typeof LISTING_TYPES)[number]["value"],
  ...(typeof LISTING_TYPES)[number]["value"][],
];
```

## 5. Data Model

Table `listing`:

| Column | Type | Rules |
|---|---|---|
| `id` | text / uuid, PK | auto-generated |
| `title` | text | required, trimmed, 3 to 120 chars |
| `price` | integer (whole RM) | required, > 0 |
| `location` | text | required, trimmed, 2 to 120 chars |
| `type` | enum (4 values above) | required |
| `whatsapp` | text | required, stored normalized as `60XXXXXXXXX` |
| `userId` | text, FK to Better-Auth `user.id` | required, `onDelete: cascade` |
| `createdAt` | timestamp | default now |

## 6. WhatsApp Normalization (Malaysia)

Implement `normalizeMyWhatsapp(input: string): string | null`:

1. Strip spaces, `-`, `(`, `)`, and `+`.
2. If it starts with `0`, replace the leading `0` with `60`.
3. If it already starts with `60`, keep it.
4. Return `null` if the result is not all digits or total length is not 11 to 12 digits.

Examples (all must yield `60123456789`): `012-345 6789`, `+60123456789`, `0123456789`, `60123456789`.

Link format on the list page: `https://wa.me/<normalized_number>`.

## 7. Task List

Mark each item `[x]` when done. Do not skip ahead.

### Phase 0: Project setup
- [x] onboard into repository first, api is on `/apps/server` foler, web is on `/apps/web`. draw the structure for example:
  ```
  src/
    app/
      buy-homestay/page.tsx
      login/page.tsx
      signup/page.tsx
      api/auth/[...all]/route.ts
    actions/create-listing.ts
    components/ (listing-form.tsx, listing-card.tsx, post-listing-cta.tsx)
    db/ (index.ts, schema.ts)
    lib/ (auth.ts, auth-client.ts, constants.ts, validations.ts, format.ts, whatsapp.ts)
  ```

### Phase 1: Database (Drizzle)
- [x] drizzle is installed and configured at `/packages/db`
- [x] config is on `/packages/db/drizzle.config.ts`.
- [x] check Better-Auth tables is on `/packages/db/src/schema/auth.ts` and setup correctly ?
- [x] Add the `listing` table and the type enum, built from `LISTING_TYPE_VALUES`.
- [x] Run `drizzle-kit generate` then `drizzle-kit migrate` (or `push`).
- [x] Verify the tables exist.

### Phase 2: Authentication (Better-Auth)
- [x] `src/lib/auth.ts`: Drizzle adapter, `emailAndPassword` enabled.
- [x] `src/app/api/auth/[...all]/route.ts`: mount the auth handler.
- [x] `src/lib/auth-client.ts`: client helper.
- [x] `/signup` page (name, email, password).
- [x] `/login` page (email, password). Support a `redirect` param back to `/buy-homestay`.
- [x] Logout button.
- [x] Server helper `getSession()` using `auth.api.getSession({ headers: await headers() })`.

### Phase 3: Validation and formatting
- [x] `listingSchema` in `packages/api/src/routers/index.ts`:
  - `title`: string, trim, min 3, max 120
  - `price`: `z.coerce.number().int().positive()`
  - `location`: string, trim, min 2, max 120
  - `type`: `z.enum(LISTING_TYPE_VALUES)`
  - `whatsapp`: transform with `normalizeMyWhatsapp`, reject `null`
- [x] `packages/db/src/utils/whatsapp.ts`: `normalizeMyWhatsapp` per section 6.
- [x] `src/lib/format.ts`: `formatRM(price)` per constraint 7.

### Phase 4: Create listing (private)
- [x] ORPC procedure `listings.create` in `packages/api/src/routers/index.ts`:
  1. Protected procedure with session check.
  2. Validate with `listingSchema`.
  3. Insert with Drizzle, using `userId = context.session.user.id`.
  4. Return the created listing.
- [x] `listing-form.tsx` (client component, uses ORPC client):
  - Fields: `title`, `price` (with "RM" prefix), `location`, `type` (dropdown, exactly 4 options from `LISTING_TYPES`), `whatsapp` (hint: `012-345 6789`).
  - Show per-field errors, a pending state on submit, and a success message with redirect.
- [x] `post-listing-cta.tsx`: if logged in, opens/links to the form. If not, links to `/login`.

### Phase 5: Public list page `/buy-homestay`
- [x] Server Component that queries all listings, newest first.
- [x] Each card shows: title, price (RM), location, type label (badge), WhatsApp button.
- [x] WhatsApp button: `https://wa.me/<whatsapp>`, `target="_blank"`, `rel="noopener noreferrer"`.
- [x] Empty state when there are no listings.
- [x] Show the CTA at the top of the page.
- [x] No edit or delete controls.
- [x] Responsive layout.

### Phase 6: Verification
Run or reason through every check and fix failures.

- [ ] Logged out: `/buy-homestay` renders the list.
- [ ] Logged out: clicking the CTA leads to `/login`.
- [ ] Logged out: calling the Server Action directly is rejected on the server.
- [ ] Logged in: a valid submission is saved and appears in the list.
- [ ] `price` of 0, negative, or empty is rejected.
- [ ] A `type` outside the 4 values (sent manually) is rejected on the server.
- [ ] The dropdown has exactly 4 selectable options with the exact label text.
- [ ] All four WhatsApp input formats normalize to `60123456789`.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

### Phase 7: Finish
- [ ] Write `README.md`: overview, stack, env variables, setup, migration commands, run instructions.
- [ ] README must list assumptions: RM stored as whole-number integer, Malaysian WhatsApp format (`60`), public list, no edit/delete.
- [ ] (Optional) Seed a few sample listings.
- [ ] (Optional) Deploy to Vercel and set env variables.

## 8. Out of Scope (do NOT implement)

- Edit or delete listings
- Image upload
- Search, filter, pagination
- Roles or admin
- Multi-currency
- Extra listing types

## 9. Acceptance Criteria (Definition of Done)

1. `/buy-homestay` is public and shows listings from the database.
2. Only authenticated users can create a listing, enforced on the server.
3. The dropdown has exactly 4 options and the value is validated on the server.
4. Data is persisted with Drizzle and prices display in RM.
5. WhatsApp links work with Malaysian numbers (`60...`).
6. `lint` and `build` pass, and the README is complete.

## 10. Agent Working Rules

- Make the smallest change that satisfies each task. Do not refactor unrelated code.
- Prefer Server Components and Server Actions. Use client components only where needed (forms, interactive CTA).
- Never trust client input. Validate and authorize on the server.
- If a requirement is ambiguous, choose the simplest interpretation, and record the assumption in the README.
- After each phase, summarize what changed and what remains.