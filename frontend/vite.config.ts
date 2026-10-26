import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api and /assets are proxied to the backend so the browser sees one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/assets": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
    },
  },
});
