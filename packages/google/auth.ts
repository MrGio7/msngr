import { google } from "googleapis";
import { z } from "zod";

const env = z
  .object({
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URL: z.string().min(1),
  })
  .parse(process.env);

const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URL);

export async function verifyAccessToken(accessToken: string) {
  const { sub, email } = await oauth2Client.getTokenInfo(accessToken);

  return { userId: sub, userEmail: email };
}
