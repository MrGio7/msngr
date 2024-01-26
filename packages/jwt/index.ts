import { JwtPayload, sign, verify } from "jsonwebtoken";

type AccessTokenPayload = JwtPayload & {
  userId: string;
  userEmail: string;
};

type TicketPayload = JwtPayload & {
  userId: string;
  userIp: string;
};

export function generateAccessToken(payload: AccessTokenPayload) {
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!secret) throw new Error("No access token secret");

  return sign(payload, secret, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string) {
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!secret) throw new Error("No access token secret");

  try {
    return verify(token, secret) as AccessTokenPayload;
  } catch (error) {
    return null;
  }
}

export function generateTicket(payload: TicketPayload) {
  const secret = process.env.TICKET_SECRET;

  if (!secret) throw new Error("No ticket secret");

  return sign(payload, secret, { expiresIn: "5m" });
}

export function verifyTicket(token: string) {
  const secret = process.env.TICKET_SECRET;

  if (!secret) throw new Error("No ticket secret");

  try {
    return verify(token, secret) as TicketPayload;
  } catch (error) {
    return null;
  }
}
