import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";

export const catalogRouter = Router();

const PRODUCT_COLUMNS = `
  id, category_id AS "categoryId", sku, name, brand, description,
  price_cents AS "priceCents", currency, image_url AS "imageUrl", attributes
`;

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
    ? await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE category_id = $1 ORDER BY sku`, [category])
    : await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY sku`);
  res.json(rows);
});

catalogRouter.get("/products/:id", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  const { rows } = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = $1`, [id.data]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(rows[0]);
});
