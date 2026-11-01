import { createAuthClient } from "better-auth/react";

function getServerUrl() {
  const url =
    process.env.SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_SERVER_URL?.trim();

  return url ? url.replace(/\/$/, "") : null;
}

function getAuthBaseUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth`;
  }

  return `${getServerUrl() ?? "http://localhost:3000"}/api/auth`;
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
});
