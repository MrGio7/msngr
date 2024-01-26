import { Dict, TRPCError, initTRPC } from "@trpc/server";
import { CreateAWSLambdaContextOptions } from "@trpc/server/adapters/aws-lambda";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { verifyAccessToken } from "../../../packages/jwt";
import SuperJSON from "superjson";

type Context = {
  user?: {
    id: string;
    email: string;
    ip: string;
  };
  resHeaders: Dict<string[] | string>;
};

export async function createContext({ event }: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>): Promise<Context> {
  const accessToken = event.cookies?.find((cookie) => cookie.startsWith("accessToken="))?.replace("accessToken=", "");
  const resHeaders: Dict<string[] | string> = {};
  const accessTokenPayload = !!accessToken ? verifyAccessToken(accessToken) : null;
  const userIp = event.requestContext.http.sourceIp;

  const user = (() => {
    if (!accessTokenPayload) return undefined;
    const { userId, userEmail } = accessTokenPayload;

    return {
      id: userId,
      email: userEmail,
      ip: userIp,
    };
  })();

  return {
    user,
    resHeaders,
  };
}

export const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
});

export const publicProcedure = t.procedure;

export const router = t.router;

export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const { user } = ctx;

  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

  return next({ ctx: { ...ctx, user } });
});

export const protectedProcedure = publicProcedure.use(authMiddleware);
