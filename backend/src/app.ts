import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { config, useGemini } from "./config.js";
import { pool } from "./db/pool.js";
import { assetsDir, uploadsDir } from "./paths.js";
import { catalogRouter } from "./routes/catalog.js";
import { catalogAdminRouter } from "./routes/catalogAdmin.js";
import { tryonRouter } from "./routes/tryon.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
  app.use(express.json());
  app.use("/assets", express.static(assetsDir));
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      tryonMode: useGemini ? "gemini" : "mock",
      imageModel: useGemini ? config.GEMINI_IMAGE_MODEL : "mock",
    });
  });

  app.use("/api", catalogRouter);
  app.use("/api", tryonRouter);
  app.use("/api", catalogAdminRouter);

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: "Invalid request", issues: err.issues });
      return;
    }
    if (err instanceof multer.MulterError) {
      const message = err.code === "LIMIT_FILE_SIZE" ? "Photo must be 10 MB or smaller" : err.message;
      res.status(400).json({ error: message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  };
  app.use(onError);

  return app;
}
