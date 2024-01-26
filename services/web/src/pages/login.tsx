import React from "react";
import { Navigate } from "react-router-dom";
import Loader from "../components/shared/loader";
import { trpc } from "../utils/trpc";

const googleAuthUrl = (() => {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", "638993814620-27rhaavgjcinumj2b4nl0ap3oqqd7ao8.apps.googleusercontent.com");
  url.searchParams.set("redirect_uri", `${window.location.origin}/login`);
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", "email profile");

  return url.toString();
})();

export function LoginPage() {
  const url = new URL(window.location.href.replace("#", "?"));
  const access_token = url.searchParams.get("access_token");
  const login = trpc.auth.login.useMutation();

  if (!access_token) {
    window.location.href = googleAuthUrl;

    return <Loader />;
  }

  React.useEffect(() => {
    login.mutate({ googleAccessToken: access_token });
  }, [access_token]);

  if (login.isLoading) return <Loader />;

  if (login.isError) return <div>ERROR: {login.error.message}</div>;

  if (!login.data) return <div>No data</div>;

  return <Navigate to="/" />;
}
