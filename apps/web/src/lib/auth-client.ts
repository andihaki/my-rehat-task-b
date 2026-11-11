import { createAuthClient } from "better-auth/react";

function getAuthBaseUrl() {
  // Browser: always talk to the Next app itself. The /api/auth route handler
  // proxies to the backend at runtime, so no hostname is frozen in the bundle.
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth`;
  }

  // SSR: the backend URL is runtime config. SERVER_URL is set by Docker Compose;
  // NEXT_PUBLIC_SERVER_URL covers local `pnpm dev` (.env.local).
  const serverUrl =
    process.env.SERVER_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    "http://server:3000";

  return new URL("/api/auth", serverUrl).toString();
}

export const authClient = createAuthClient({ baseURL: getAuthBaseUrl() });
