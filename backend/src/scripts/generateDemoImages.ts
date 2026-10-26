// Generates the demo's product photos and sample shopper photos with Gemini and writes them into
// backend/assets, so they can be committed and the app needs no image generation at runtime.
//
// Usage: npm run demo-images                     # only images that don't exist yet
//        npm run demo-images -- --force          # regenerate everything
//        npm run demo-images -- APP-001 hand     # just these SKUs / sample subjects (always regenerated)
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { productImagePrompt } from "../catalog/imagePrompts.js";
import { samplePhotoPrompts } from "../catalog/samplePrompts.js";
import { config } from "../config.js";
import { pool } from "../db/pool.js";
import { assetsDir } from "../paths.js";
import { generateImageFromText } from "../tryon/gemini.js";
import type { RequiredSubject } from "../tryon/types.js";

interface Job {
  name: string;
  file: string;
  prompt: string;
  aspectRatio: string;
  maxSide: number;
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = new Set(args.filter((a) => !a.startsWith("--")));

async function jobs(): Promise<Job[]> {
  const { rows } = await pool.query<{
    sku: string;
    categoryId: string;
    name: string;
    description: string;
    attributes: Record<string, unknown>;
  }>(`SELECT sku, category_id AS "categoryId", name, description, attributes FROM products ORDER BY sku`);

  const products: Job[] = rows.map((p) => ({
    name: p.sku,
    file: path.join(assetsDir, "products", `${p.sku}.jpg`),
    prompt: productImagePrompt(p),
    aspectRatio: "1:1",
    maxSide: 1024,
  }));
  const samples: Job[] = (Object.keys(samplePhotoPrompts) as RequiredSubject[]).map((subject) => ({
    name: subject,
    file: path.join(assetsDir, "samples", `${subject}.jpg`),
    prompt: samplePhotoPrompts[subject].prompt,
    aspectRatio: samplePhotoPrompts[subject].aspectRatio,
    maxSide: 1536,
  }));

  return [...samples, ...products].filter((job) =>
    only.size > 0 ? only.has(job.name) : force || !existsSync(job.file),
  );
}

try {
  if (!config.GEMINI_API_KEY) throw new Error("Set GEMINI_API_KEY in .env first");
  const todo = await jobs();
  console.log(`Generating ${todo.length} image(s) with ${config.GEMINI_IMAGE_MODEL}`);
  let failed = 0;
  for (const [i, job] of todo.entries()) {
    try {
      const image = await generateImageFromText(job.prompt, job.aspectRatio);
      const jpeg = await sharp(image)
        .resize({ width: job.maxSide, height: job.maxSide, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 86, mozjpeg: true })
        .toBuffer();
      await mkdir(path.dirname(job.file), { recursive: true });
      await writeFile(job.file, jpeg);
      console.log(`[${i + 1}/${todo.length}] ${job.name}: ${path.relative(process.cwd(), job.file)}`);
    } catch (err) {
      failed++;
      console.error(`[${i + 1}/${todo.length}] ${job.name}: ${(err as Error).message}`);
    }
  }
  if (failed) {
    console.error(`${failed} image(s) failed; run the command again to retry them.`);
    process.exitCode = 1;
  }
} catch (err) {
  console.error((err as Error).message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
