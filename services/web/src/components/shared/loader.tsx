import { CircularProgress } from "@mui/material";
import React from "react";

export default function Loader() {
  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress size={100} />
    </div>
  );
}
