import { existsSync } from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { z } from "zod";
import { samplePhotoPrompts } from "../catalog/samplePrompts.js";
import { pool } from "../db/pool.js";
import { assetsDir } from "../paths.js";
import { saveImage } from "../tryon/storage.js";
import type { RequiredSubject } from "../tryon/types.js";

// Sample shopper photos offered in the try-on panel. The defaults ship in backend/assets/samples
// (made with `npm run demo-images`); one uploaded on the demo images page takes precedence.
export const samplesRouter = Router();

const subjectParam = z.enum(["full_body", "face", "head_and_shoulders", "hand", "room"]);

function bundledSample(subject: RequiredSubject): string | null {
  return existsSync(path.join(assetsDir, "samples", `${subject}.jpg`)) ? `/assets/samples/${subject}.jpg` : null;
}

async function listSamples() {
  const { rows } = await pool.query<{ subject: RequiredSubject; imageUrl: string }>(
    `SELECT subject, image_url AS "imageUrl" FROM sample_photos`,
  );
  const urls = new Map(rows.map((r) => [r.subject, r.imageUrl]));
  return (Object.keys(samplePhotoPrompts) as RequiredSubject[]).map((subject) => ({
    subject,
    label: samplePhotoPrompts[subject].label,
    prompt: samplePhotoPrompts[subject].prompt,
    imageUrl: urls.get(subject) ?? bundledSample(subject),
  }));
}

async function saveSample(subject: RequiredSubject, input: Buffer) {
  const jpeg = await sharp(input)
    .rotate()
    .resize({ width: 1536, height: 1536, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
  const imageUrl = await saveImage("samples", `${subject}-${Date.now()}`, jpeg, "image/jpeg");
  await pool.query(
    `INSERT INTO sample_photos (subject, image_url) VALUES ($1, $2)
     ON CONFLICT (subject) DO UPDATE SET image_url = EXCLUDED.image_url, updated_at = now()`,
    [subject, imageUrl],
  );
  return (await listSamples()).find((s) => s.subject === subject);
}

samplesRouter.get("/samples", async (_req, res) => {
  res.json(await listSamples());
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});

// multipart/form-data with field: image
samplesRouter.post("/admin/samples/:subject", upload.single("image"), async (req, res) => {
  const subject = subjectParam.safeParse(req.params.subject);
  if (!subject.success) {
    res.status(400).json({ error: "Unknown sample photo" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "Attach a JPEG, PNG or WebP image of up to 10 MB as 'image'" });
    return;
  }
  try {
    res.json(await saveSample(subject.data, req.file.buffer));
  } catch {
    res.status(400).json({ error: "That file could not be read as an image" });
  }
});
