import { router } from "../trpc";
import { authRouter } from "./auth";
import { conversationRouter } from "./conversation";
import { messageRouter } from "./message";
import { userRouter } from "./user";

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  conversation: conversationRouter,
  message: messageRouter,
});

export type AppRouter = typeof appRouter;
