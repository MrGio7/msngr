import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { prisma } from "/opt/prisma/client";
import { newMessageNotify } from "@msngr/aws/ws";

export const messageRouter = router({
  getMany: protectedProcedure
    .input(
      z.object({
        filter: z.object({
          conversationId: z.number(),
        }),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const { filter, limit, offset } = input;

      const messages = await prisma.message.findMany({
        orderBy: { createdAt: "desc" },
        where: {
          conversationId: filter.conversationId,
        },
        select: {
          text: true,
          User: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        take: limit,
        skip: offset,
      });

      return messages;
    }),

  send: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        text: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { conversationId, text } = input;

      const message = await prisma.message.create({
        data: {
          text,
          Conversation: { connect: { id: conversationId } },
          User: { connect: { id: user.id } },
        },
        select: {
          Conversation: {
            select: {
              Users: {
                where: { id: { not: user.id } },
                select: { Connections: { select: { id: true } } },
              },
            },
          },
        },
      });

      const connectionIds = message.Conversation.Users.flatMap((user) => user.Connections.map((connection) => connection.id));

      await newMessageNotify({
        connectionIds,
        conversationId,
      });

      return "OK";
    }),
});
