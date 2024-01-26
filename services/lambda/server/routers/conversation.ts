import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { prisma } from "/opt/prisma/client";
import { newMessageNotify } from "@msngr/aws/ws";

export const conversationRouter = router({
  getMany: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          Conversations: {
            orderBy: { updatedAt: "desc" },
            take: input.limit,
            skip: input.offset,
            select: {
              id: true,
              Users: {
                where: { id: { not: ctx.user.id } },
                select: { id: true, email: true },
              },
            },
          },
        },
      });

      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      return user.Conversations;
    }),

  get: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { id } = input;

      const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: {
          id: true,
          Users: {
            where: { id: { not: user.id } },
            select: { id: true, email: true },
          },
        },
      });

      if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });

      return conversation;
    }),

  find: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conversation = await prisma.conversation.findFirst({
        where: {
          AND: [{ Users: { some: { id: ctx.user.id } } }, { Users: { some: { id: input.userId } } }],
        },
        select: {
          id: true,
        },
      });

      return conversation;
    }),

  start: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await prisma.conversation.create({
        data: {
          Users: {
            connect: [{ id: ctx.user.id }, { id: input.userId }],
          },
          Messages: {
            create: {
              text: input.message,
              User: { connect: { id: ctx.user.id } },
            },
          },
        },
        select: {
          id: true,
          Users: {
            where: { id: { not: ctx.user.id } },
            select: { Connections: { select: { id: true } } },
          },
        },
      });

      const connectionIds = conversation.Users.flatMap((user) => user.Connections.map((connection) => connection.id));

      await newMessageNotify({
        connectionIds,
        conversationId: conversation.id,
      });

      return conversation;
    }),
});
