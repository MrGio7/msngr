import { verifyTicket } from "@msngr/jwt";
import { Handler } from "aws-lambda";
import { prisma } from "/opt/prisma/client";

export const handler: Handler = async (event) => {
  const ticket = event.queryStringParameters?.ticket as string | undefined;
  const userIp = event.requestContext.identity?.sourceIp as string | undefined;
  const connectionId = event.requestContext.connectionId as string | undefined;

  if (!ticket) return { statusCode: 400, body: "No ticket" };
  if (!userIp) return { statusCode: 400, body: "No userIp" };
  if (!connectionId) return { statusCode: 400, body: "No connectionId" };

  const ticketPayload = verifyTicket(ticket);

  if (!ticketPayload) return { statusCode: 400, body: "Invalid ticket" };
  if (ticketPayload.userIp !== userIp) return { statusCode: 400, body: "Invalid userIp" };

  await prisma.connection.create({
    data: {
      id: connectionId,
      userId: ticketPayload.userId,
    },
  });

  return {
    statusCode: 200,
    body: "connected",
  };
};
