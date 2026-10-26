import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { config } from "./config.js";
import { pool } from "./db/pool.js";
import { catalogRouter } from "./routes/catalog.js";

const assetsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets");

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
  app.use(express.json());
  app.use("/assets", express.static(assetsDir));

  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok", gemini: config.GEMINI_API_KEY ? "configured" : "missing" });
  });

  app.use("/api", catalogRouter);

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: "Invalid request", issues: err.issues });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  };
  app.use(onError);

  return app;
}
