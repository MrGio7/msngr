import { Box, Stack, TextField, Typography, CircularProgress, Button } from "@mui/material";
import React, { useEffect } from "react";
import { SendRounded } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { trpc } from "../utils/trpc";
import Loader from "../components/shared/loader";
import { useLoaderData } from "../App";
import { twMerge } from "tailwind-merge";
import { useWS } from "../context/ws.context";

export function Conversation() {
  const params = useParams();
  const { userInfo } = useLoaderData();
  const ws = useWS();

  const conversationId = params.conversationId && +params.conversationId;
  if (!conversationId) return <h1>Wrong Conversation Id</h1>;

  const messages = trpc.message.getMany.useQuery({ filter: { conversationId } });
  const sendMessage = trpc.message.send.useMutation();

  useEffect(() => {
    ws.message?.action === "newMessage" && //
      ws.message.conversationId === conversationId &&
      messages.refetch();
  }, [ws.message]);

  if (messages.isInitialLoading) return <Loader />;
  if (!messages.data) return <h1>Something went wrong</h1>;

  return (
    <Stack component="main" gap={2} justifyContent="space-between" className="h-dvh px-5 pb-5">
      <Stack component="ul" gap={2} direction="column-reverse" className="overflow-y-scroll no-scrollbar">
        {messages.data.map(({ text, User }, idx) => {
          const isOwn = User.id === userInfo.id;
          return (
            <Box key={idx} component="li" className={twMerge(!isOwn && "ml-auto")}>
              <Typography className={twMerge("rounded-xl px-5 py-3 w-max", isOwn ? "bg-emerald-500" : "bg-cyan-500")}>{text}</Typography>
            </Box>
          );
        })}
      </Stack>

      <Stack
        component="form"
        direction="row"
        alignItems="center"
        gap={2}
        onSubmit={(ev) => {
          ev.preventDefault();
          const formData = new FormData(ev.currentTarget);
          const message = formData.get("message")?.toString();
          const messageInput = ev.currentTarget.querySelector("input[name='message']") as HTMLInputElement;
          if (!message) return;

          sendMessage.mutate(
            { conversationId, text: message },
            {
              onSuccess() {
                messages.refetch();
                messageInput.value = "";
              },
            }
          );
        }}
      >
        <TextField variant="outlined" fullWidth placeholder="Send Message" name="message" />

        {sendMessage.isLoading ? (
          <CircularProgress />
        ) : (
          <Button type="submit">
            <SendRounded fontSize="large" />
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
