import { awsLambdaRequestHandler } from "@trpc/server/adapters/aws-lambda";
import { appRouter } from "./routers";
import { createContext } from "./trpc";

export const handler = awsLambdaRequestHandler({
  router: appRouter,
  createContext,
  responseMeta({ ctx }) {
    return {
      headers: {
        ...(ctx?.resHeaders || {}),
      },
    };
  },
});
