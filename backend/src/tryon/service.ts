import { pool } from "../db/pool.js";
import { generator } from "./generator.js";
import { loadProductImage, prepareUpload } from "./images.js";
import { checkPhoto } from "./photoCheck.js";
import { buildTryOnPrompt } from "./prompts.js";
import { saveImage } from "./storage.js";
import { requiredSubject } from "./subjects.js";
import { type TryOnProduct, TryOnRejection } from "./types.js";

export const SESSION_COLUMNS = `
  s.id, s.product_id AS "productId", p.name AS "productName", p.category_id AS "categoryId",
  s.status, s.user_image_path AS "userImageUrl", s.result_image_path AS "resultImageUrl",
  s.model, s.latency_ms AS "latencyMs", s.error_message AS "errorMessage",
  s.created_at AS "createdAt", s.completed_at AS "completedAt"
`;

export async function findProduct(productId: string): Promise<TryOnProduct | undefined> {
  const { rows } = await pool.query<TryOnProduct>(
    `SELECT p.id, p.category_id AS "categoryId", c.photo_subject AS "categorySubject",
            p.name, p.description, p.image_url AS "imageUrl", p.attributes
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [productId],
  );
  return rows[0];
}

export async function getSession(id: string) {
  const { rows } = await pool.query(
    `SELECT ${SESSION_COLUMNS} FROM tryon_sessions s JOIN products p ON p.id = s.product_id WHERE s.id = $1`,
    [id],
  );
  return rows[0];
}

/**
 * Runs one try-on end to end and records it in tryon_sessions.
 * Resolves with the finished session whether it succeeded or failed; only unexpected errors throw.
 */
export async function runTryOn(product: TryOnProduct, upload: Buffer) {
  const started = Date.now();
  const photo = await prepareUpload(upload);

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO tryon_sessions (product_id, status, user_image_path) VALUES ($1, 'processing', '') RETURNING id`,
    [product.id],
  );
  const sessionId = rows[0].id;
  const userImagePath = await saveImage("inputs", sessionId, photo.data, photo.mimeType);
  const prompt = buildTryOnPrompt(product);
  await pool.query(`UPDATE tryon_sessions SET user_image_path = $2, prompt = $3, model = $4 WHERE id = $1`, [
    sessionId,
    userImagePath,
    prompt,
    generator.name,
  ]);

  try {
    await checkPhoto(photo, requiredSubject(product));
    const result = await generator.generate({ prompt, photo, product: await loadProductImage(product.imageUrl) });
    const resultPath = await saveImage("results", sessionId, result.data, result.mimeType);
    await pool.query(
      `UPDATE tryon_sessions
       SET status = 'succeeded', result_image_path = $2, model = $3, latency_ms = $4, completed_at = now()
       WHERE id = $1`,
      [sessionId, resultPath, result.model, Date.now() - started],
    );
  } catch (err) {
    const message =
      err instanceof TryOnRejection ? err.message : "Something went wrong generating the try-on. Please try again.";
    if (!(err instanceof TryOnRejection)) console.error(`try-on ${sessionId} failed`, err);
    await pool.query(
      `UPDATE tryon_sessions
       SET status = 'failed', error_message = $2, latency_ms = $3, completed_at = now()
       WHERE id = $1`,
      [sessionId, message, Date.now() - started],
    );
  }

  return getSession(sessionId);
}
