import { Handler } from "aws-lambda";
import { prisma } from "/opt/prisma/client";

export const handler: Handler = async (event) => {
  const connectionId = event.requestContext.connectionId as string | undefined;

  if (!connectionId) return { statusCode: 400, body: "No connectionId" };

  await prisma.connection.delete({ where: { id: connectionId } });

  return {
    statusCode: 200,
    body: "connect",
  };
};
