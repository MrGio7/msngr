import { APIGatewayRequestSimpleAuthorizerHandlerV2 } from "aws-lambda";

export const handler: APIGatewayRequestSimpleAuthorizerHandlerV2 = async (event) => {
  const ratToken = process.env.RAT_TOKEN;
  const requestToken = event.headers?.["x-rat-token"];

  if (!ratToken || !requestToken || requestToken !== ratToken) return { isAuthorized: false };

  return { isAuthorized: true };
};
