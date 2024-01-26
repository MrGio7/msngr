import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default ({ command }) =>
  defineConfig({
    plugins: [react(), tsconfigPaths()],
    server: {
      ...(command === "serve"
        ? {
            proxy: {
              "/api": {
                target: "https://msngr.gbdev.click", // Replace with your actual API server URL
                changeOrigin: true,
              },
            },
          }
        : {}),
    },
  });
