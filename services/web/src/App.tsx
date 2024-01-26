import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState } from "react";
import SuperJSON from "superjson";
import { trpc, trpcProxy, RouterOutput } from "./utils/trpc";
import { createBrowserRouter, LoaderFunction, redirect, RouterProvider, useLoaderData as getLoaderData } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { HomePage } from "./pages/home";
import { Conversation } from "./pages/conversation";
import { WSProvider } from "./context/ws.context";

const loader: LoaderFunction = async () => {
  const userInfo = await trpcProxy.user.info.query().catch((error) => {
    console.error(error);
    return null;
  });

  if (!userInfo) {
    return redirect("/login");
  }

  return { userInfo };
};

type LoaderData = {
  userInfo: RouterOutput["user"]["info"];
};

export const useLoaderData = () => getLoaderData() as LoaderData;

const router = createBrowserRouter([
  {
    index: true,
    loader,
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/conversation/:conversationId",
    loader,
    element: <Conversation />,
  },
]);

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: SuperJSON,
      links: [
        httpBatchLink({
          url: `${window.location.origin}/api`,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <WSProvider>
          <RouterProvider router={router} />
        </WSProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
