import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const client = new ApiGatewayManagementApiClient({
  region: "eu-west-1",
  endpoint: "https://6fmknljqm4.execute-api.eu-west-1.amazonaws.com/prod",
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
