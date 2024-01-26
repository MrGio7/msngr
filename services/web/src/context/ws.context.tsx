import React, { FC, ReactNode, createContext, useContext, useState } from "react";
import { trpc } from "../utils/trpc";
import { WS_HOST } from "../../../../config/base";

type Message = {
  action: string;
  conversationId: number;
};
type WSContextType = {
  connected: boolean;
  message?: Message;
};

const WSContext = createContext<WSContextType>({} as WSContextType);

export const WSProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState<Message>();

  trpc.user.wsTicket.useQuery(undefined, {
    enabled: !connected,
    onSuccess(ticket) {
      const ws = new WebSocket(`wss://${WS_HOST}?ticket=${ticket}`);

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        const data: Message = JSON.parse(event.data);
        setMessage(data);
      };
    },
  });

  return <WSContext.Provider value={{ connected, message }}>{children}</WSContext.Provider>;
};

export const useWS = () => useContext(WSContext);
