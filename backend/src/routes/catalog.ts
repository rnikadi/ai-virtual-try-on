import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requiredSubject } from "../tryon/subjects.js";
import type { TryOnProduct } from "../tryon/types.js";

export const catalogRouter = Router();

const PRODUCT_SELECT = `
  SELECT p.id, p.category_id AS "categoryId", p.sku, p.name, p.brand, p.description,
         p.price_cents AS "priceCents", p.currency, p.image_url AS "imageUrl", p.attributes,
         c.photo_subject AS "categorySubject"
  FROM products p JOIN categories c ON c.id = p.category_id
`;

// Adds the kind of photo this specific product needs (e.g. a hand photo for a ring).
function withRequiredPhoto({ categorySubject, ...product }: TryOnProduct & Record<string, unknown>) {
  return { ...product, requiredPhoto: requiredSubject({ ...product, categorySubject } as TryOnProduct) };
}

catalogRouter.get("/categories", async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT id, name, description, photo_subject AS "photoSubject",
           photo_guidance AS "photoGuidance"
    FROM categories
    ORDER BY sort_order
  `);
  res.json(rows);
});

const productQuery = z.object({ category: z.string().optional() });

catalogRouter.get("/products", async (req, res) => {
  const { category } = productQuery.parse(req.query);
  const { rows } = category
    ? await pool.query(`${PRODUCT_SELECT} WHERE p.category_id = $1 ORDER BY p.sku`, [category])
    : await pool.query(`${PRODUCT_SELECT} ORDER BY p.sku`);
  res.json(rows.map(withRequiredPhoto));
});

catalogRouter.get("/products/:id", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  const { rows } = await pool.query(`${PRODUCT_SELECT} WHERE p.id = $1`, [id.data]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(withRequiredPhoto(rows[0]));
});
