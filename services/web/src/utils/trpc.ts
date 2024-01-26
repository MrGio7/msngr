import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../lambda/server/routers";
import SuperJSON from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export const trpcProxy = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: `${window.location.origin}/api`,
    }),
  ],
});

export type RouterOutput = inferRouterOutputs<AppRouter>;
