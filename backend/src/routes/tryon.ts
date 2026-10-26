import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { findProduct, getSession, runTryOn, SESSION_COLUMNS } from "../tryon/service.js";

export const tryonRouter = Router();

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ACCEPTED_TYPES.has(file.mimetype)),
});

const createBody = z.object({ productId: z.string().uuid() });

// multipart/form-data with fields: productId, photo (image file)
tryonRouter.post("/tryon", upload.single("photo"), async (req, res) => {
  const body = createBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "productId must be a valid product id" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "Attach a JPEG, PNG or WebP photo of up to 10 MB as 'photo'" });
    return;
  }
  const product = await findProduct(body.data.productId);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const session = await runTryOn(product, req.file.buffer);
  res.status(session.status === "succeeded" ? 201 : 422).json(session);
});

tryonRouter.get("/tryon/:id", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const session = id.success ? await getSession(id.data) : undefined;
  if (!session) {
    res.status(404).json({ error: "Try-on not found" });
    return;
  }
  res.json(session);
});

const listQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(12) });

tryonRouter.get("/tryon", async (req, res) => {
  const { limit } = listQuery.parse(req.query);
  const { rows } = await pool.query(
    `SELECT ${SESSION_COLUMNS} FROM tryon_sessions s JOIN products p ON p.id = s.product_id
     ORDER BY s.created_at DESC LIMIT $1`,
    [limit],
  );
  res.json(rows);
});
