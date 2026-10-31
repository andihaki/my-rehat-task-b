import type { AppRouterClient } from "@myrehat-task-b/api/routers/index";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        toast.error(`Error: ${error.message}`, {
          action: {
            label: "retry",
            onClick: () => {
              query.invalidate();
            },
          },
        });
      },
    }),
  });
}

export const queryClient = createQueryClient();

function getServerUrl() {
  const url =
    process.env.SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_SERVER_URL?.trim();

  if (!url) {
    return null;
  }

  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getRpcUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/rpc`;
  }

  const serverUrl = getServerUrl();
  if (!serverUrl) {
    throw new Error("SERVER_URL or NEXT_PUBLIC_SERVER_URL must be configured");
  }

  return `${serverUrl}/rpc`;
}

export const link = new RPCLink({
  url: getRpcUrl,
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: "include",
    });
  },
  headers: async () => {
    if (typeof window !== "undefined") {
      return {};
    }

    const { headers } = await import("next/headers");
    return Object.fromEntries(await headers());
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
