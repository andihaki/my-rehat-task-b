import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@myrehat-task-b/db";
import * as schema from "@myrehat-task-b/db/schema/auth";
import { betterAuth } from "better-auth";

export type AuthConfig = {
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	CORS_ORIGIN: string;
};

function getForwardedOrigin(request?: Request) {
	const origin = request?.headers.get("origin");
	const forwardedHost = request?.headers
		.get("x-forwarded-host")
		?.split(",")[0]
		?.trim();

	if (!origin || !forwardedHost) {
		return [];
	}

	try {
		const originUrl = new URL(origin);
		return originUrl.host === forwardedHost ? [originUrl.origin] : [];
	} catch {
		return [];
	}
}

export function createAuth(
	env: AuthConfig,
	database: Database,
	desktopOrigins: readonly string[] = [],
) {
	return betterAuth({
		database: drizzleAdapter(database, {
			provider: "pg",
			schema,
		}),
		trustedOrigins: (request) => [
			env.CORS_ORIGIN,
			...desktopOrigins,
			...getForwardedOrigin(request),
		],
		emailAndPassword: { enabled: true },
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "lax",
				secure: false,
				httpOnly: true,
			},
		},
		plugins: [],
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
