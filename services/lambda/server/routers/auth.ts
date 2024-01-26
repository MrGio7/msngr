import { verifyAccessToken } from "@msngr/google/auth";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateAccessToken } from "../../../../packages/jwt";
import { publicProcedure, router } from "../trpc";
import { prisma } from "/opt/prisma/client";

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        googleAccessToken: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { googleAccessToken } = input;

      const { userEmail, userId } = await verifyAccessToken(googleAccessToken).catch((err) => {
        console.error(err);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid access token" });
      });

      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User ID" });
      if (!userEmail) throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing email" });

      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: userEmail.toLowerCase(),
          lastLogin: new Date(),
        },
        update: {
          lastLogin: new Date(),
        },
      });

      const accessToken = generateAccessToken({ userId: userId, userEmail: userEmail.toLowerCase() });

      ctx.resHeaders = {
        ...ctx.resHeaders,
        "Set-Cookie": `accessToken=${accessToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Strict; Secure`,
      };

      return "OK";
    }),

  logout: publicProcedure.query(async ({ ctx }) => {
    ctx.resHeaders = {
      ...ctx.resHeaders,
      "Set-Cookie": "accessToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure",
    };

    return "OK";
  }),
});
