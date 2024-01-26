import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { prisma } from "/opt/prisma/client";
import { generateTicket } from "@msngr/jwt";
import { z } from "zod";

export const userRouter = router({
  getMany: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { search, limit, offset } = input;

      const users = await prisma.user.findMany({
        where: {
          email: { startsWith: search?.trim().toLowerCase(), not: user.email },
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          email: true,
        },
      });

      return users;
    }),

  info: protectedProcedure.query(({ ctx }) => {
    return { id: ctx.user.id, email: ctx.user.email };
  }),

  wsTicket: protectedProcedure.query(({ ctx: { user } }) => {
    return generateTicket({ userId: user.id, userIp: user.ip });
  }),
});
