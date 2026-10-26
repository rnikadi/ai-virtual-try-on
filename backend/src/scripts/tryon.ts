// Runs one try-on from the command line, for checking quality with real photos.
// Usage: npm run tryon -- <SKU> <path/to/photo.jpg>
import { readFile } from "node:fs/promises";
import { pool } from "../db/pool.js";
import { findProduct, runTryOn } from "../tryon/service.js";

const [sku, photoPath] = process.argv.slice(2);
if (!sku || !photoPath) {
  console.error("Usage: npm run tryon -- <SKU> <path/to/photo.jpg>");
  process.exit(1);
}

try {
  const { rows } = await pool.query<{ id: string }>("SELECT id FROM products WHERE sku = $1", [sku]);
  const product = rows[0] && (await findProduct(rows[0].id));
  if (!product) throw new Error(`No product with SKU ${sku}`);
  const session = await runTryOn(product, await readFile(photoPath));
  console.log(`${session.status} in ${session.latencyMs} ms using ${session.model}`);
  console.log(session.resultImageUrl ? `result: backend${session.resultImageUrl}` : `error: ${session.errorMessage}`);
} catch (err) {
  console.error((err as Error).message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
