import { createAuthClient } from "better-auth/react";

// function getServerUrl() {
//   const url =
//     process.env.SERVER_URL?.trim() ||
//     process.env.NEXT_PUBLIC_SERVER_URL?.trim();

//   return url ? url.replace(/\/$/, "") : null;
// }

// function getAuthBaseUrl() {
//   if (typeof window !== "undefined") {
//     return `${window.location.origin}/api/auth`;
//   }

//   return `${getServerUrl() ?? "http://localhost:3000"}/api/auth`;
// }

// export const authClient = createAuthClient({
//   baseURL: getAuthBaseUrl(),
// });

function getServerUrl(url: string) {
  const processEnv = typeof process === "undefined" ? undefined : process.env;
  if (typeof window === "undefined" && processEnv?.SERVER_URL) {
    return processEnv.SERVER_URL.endsWith("/")
      ? processEnv.SERVER_URL.slice(0, -1)
      : processEnv.SERVER_URL;
  }

  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const authClient = createAuthClient({
  baseURL: new URL(
    "/api/auth",
    getServerUrl(process.env.NEXT_PUBLIC_SERVER_URL!),
  ).toString(),
});
