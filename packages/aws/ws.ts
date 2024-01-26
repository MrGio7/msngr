import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { WS_HOST } from "config/base";

const client = new ApiGatewayManagementApiClient({
  region: "eu-west-1",
  endpoint: `https://${WS_HOST}`,
});

export async function newMessageNotify(args: { connectionIds: string[]; conversationId: number }) {
  const { connectionIds, conversationId } = args;

  const postToConnectionPromises = connectionIds.map((connectionId) => {
    const postToConnectionCommand = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify({
        action: "newMessage",
        conversationId,
      }),
    });

    return client.send(postToConnectionCommand);
  });

  return Promise.all(postToConnectionPromises);
}
