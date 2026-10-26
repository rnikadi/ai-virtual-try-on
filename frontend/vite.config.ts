import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api, /assets and /uploads are proxied to the backend so the browser sees one origin.
// API_PROXY_TARGET is set by docker-compose.yml, where the backend runs as http://backend:4000.
const target = process.env.API_PROXY_TARGET ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": target,
      "/assets": target,
      "/uploads": target,
    },
    // Bind mounts on Docker Desktop don't always deliver file events; poll there.
    watch: process.env.API_PROXY_TARGET ? { usePolling: true, interval: 300 } : undefined,
  },
});
