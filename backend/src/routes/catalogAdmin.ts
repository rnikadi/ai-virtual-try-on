import { Modality } from "@google/genai";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { z } from "zod";
import { productImagePrompt } from "../catalog/imagePrompts.js";
import { config, useGemini } from "../config.js";
import { pool } from "../db/pool.js";
import { blockReason, gemini } from "../tryon/gemini.js";
import { saveImage } from "../tryon/storage.js";

// Catalog management for the demo: see each product's image prompt, then generate or upload its photo.
// No authentication; this POC is meant to run locally.
export const catalogAdminRouter = Router();

const ADMIN_SELECT = `
  SELECT id, category_id AS "categoryId", sku, name, brand, description,
         image_url AS "imageUrl", attributes
  FROM products
`;

interface AdminProduct {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  description: string;
  imageUrl: string;
  attributes: Record<string, unknown>;
}

const toAdminView = (p: AdminProduct) => ({
  ...p,
  imagePrompt: productImagePrompt(p),
  hasUploadedImage: p.imageUrl.startsWith("/uploads/"),
});

catalogAdminRouter.get("/admin/products", async (_req, res) => {
  const { rows } = await pool.query<AdminProduct>(`${ADMIN_SELECT} ORDER BY category_id, sku`);
  res.json(rows.map(toAdminView));
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});

// multipart/form-data with field: image
catalogAdminRouter.post("/admin/products/:id/image", upload.single("image"), async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "Attach a JPEG, PNG or WebP image of up to 10 MB as 'image'" });
    return;
  }
  const { rows } = await pool.query<AdminProduct>(`${ADMIN_SELECT} WHERE id = $1`, [id.data]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  try {
    res.json(toAdminView(await saveProductImage(rows[0], req.file.buffer)));
  } catch {
    res.status(400).json({ error: "That file could not be read as an image" });
  }
});

// Generates the product photo from its image prompt with the Gemini image model and saves it.
catalogAdminRouter.post("/admin/products/:id/image/generate", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  if (!useGemini) {
    res.status(409).json({ error: "Add GEMINI_API_KEY to .env and restart the backend to generate images" });
    return;
  }
  const { rows } = await pool.query<AdminProduct>(`${ADMIN_SELECT} WHERE id = $1`, [id.data]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  try {
    const result = await gemini().models.generateContent({
      model: config.GEMINI_IMAGE_MODEL,
      contents: productImagePrompt(rows[0]),
      config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: "1:1" } },
    });
    const data = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
    if (blockReason(result) || !data) {
      res.status(422).json({ error: "Gemini did not return an image for this prompt. Please try again." });
      return;
    }
    res.json(toAdminView(await saveProductImage(rows[0], Buffer.from(data, "base64"))));
  } catch (err) {
    console.error(`generating image for ${rows[0].sku} failed`, err);
    res.status(502).json({ error: `Gemini request failed: ${(err as Error).message.slice(0, 200)}` });
  }
});

/** Normalises an image to a PNG of at most 1024 px, stores it and points the product at it. */
async function saveProductImage(product: AdminProduct, input: Buffer) {
  const png = await sharp(input)
    .rotate()
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  // A new file name each time so browsers don't show a cached older image.
  const imageUrl = await saveImage("products", `${product.sku}-${Date.now()}`, png, "image/png");
  const { rows } = await pool.query<AdminProduct>(
    `UPDATE products SET image_url = $2 WHERE id = $1
     RETURNING id, category_id AS "categoryId", sku, name, brand, description, image_url AS "imageUrl", attributes`,
    [product.id, imageUrl],
  );
  return rows[0];
}

// Puts the bundled placeholder back.
catalogAdminRouter.delete("/admin/products/:id/image", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  const { rows } = await pool.query<AdminProduct>(
    `UPDATE products SET image_url = '/assets/products/' || sku || '.png' WHERE id = $1
     RETURNING id, category_id AS "categoryId", sku, name, brand, description, image_url AS "imageUrl", attributes`,
    [id.data],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(toAdminView(rows[0]));
});
