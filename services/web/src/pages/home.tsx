import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemAvatar, ListItemText, TextField } from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import Loader from "../components/shared/loader";
import { useDebounce } from "../hooks/useDebounce";
import { trpc } from "../utils/trpc";
import { useNavigate } from "react-router-dom";
import { useWS } from "../context/ws.context";

export function HomePage() {
  const navigate = useNavigate();
  const ws = useWS();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dialog, setDialog] = useState({ opened: false, userId: "" });
  const debouncedSearch = useDebounce(search, 300);
  const conversations = trpc.conversation.getMany.useQuery({});
  trpc.conversation.find.useQuery(
    { userId: selectedUserId },
    {
      enabled: !!selectedUserId,
      onSuccess(data) {
        if (!data) {
          setDialog({ opened: true, userId: selectedUserId });
          return;
        }

        navigate(`/conversation/${data.id}`);
      },
    }
  );
  const startConversation = trpc.conversation.start.useMutation({
    onSuccess() {
      conversations.refetch();
    },
  });
  const users = trpc.user.getMany.useQuery(
    { search: debouncedSearch }, //
    { enabled: !!debouncedSearch }
  );

  function closeDialog() {
    setDialog({ opened: false, userId: "" });
  }

  useEffect(() => {
    ws.message?.action === "newMessage" && conversations.refetch();
  }, [ws.message]);

  if (conversations.isLoading || !conversations.isSuccess) {
    return <Loader />;
  }

  return (
    <main>
      <Autocomplete
        options={users.data || []} //
        getOptionKey={({ id }) => id}
        getOptionLabel={({ email }) => email}
        loading={users.isFetching && users.isLoading}
        onChange={(_ev, user) => {
          if (!user) return;

          setSelectedUserId(user.id);
        }}
        renderInput={(params) => <TextField {...params} value={search} onChange={(ev) => setSearch(ev.target.value)} />}
      />
      <List>
        {!conversations.data.length && (
          <ListItem>
            <ListItemText>No conversations</ListItemText>
          </ListItem>
        )}
        {conversations.data.map(({ id, Users }) => (
          <ListItem key={id} onClick={() => navigate(`conversation/${id}`)} className="cursor-pointer">
            <ListItemAvatar>
              <AccountCircle />
            </ListItemAvatar>
            <ListItemText>{Users.map(({ email }) => email).join(", ")}</ListItemText>
          </ListItem>
        ))}
      </List>
      <Dialog
        open={dialog.opened}
        onClose={closeDialog}
        PaperProps={{
          component: "form",
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const message = formData.get("message")?.toString();

            if (!message) return;

            startConversation.mutate(
              { message, userId: dialog.userId },
              {
                onSuccess(data) {
                  closeDialog();
                  navigate(`/conversation/${data.id}`);
                },
              }
            );
          },
        }}
      >
        <DialogTitle>Start a conversation</DialogTitle>
        <DialogContent>
          <TextField label="Message" name="message" multiline fullWidth variant="outlined" />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button type="submit">Send</Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
