import { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  console.log("connect", event);

  return {
    statusCode: 200,
    body: "connect",
  };
};
