import { Modality } from "@google/genai";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { z } from "zod";
import { samplePhotoPrompts } from "../catalog/samplePrompts.js";
import { config, useGemini } from "../config.js";
import { pool } from "../db/pool.js";
import { blockReason, gemini } from "../tryon/gemini.js";
import { saveImage } from "../tryon/storage.js";
import type { RequiredSubject } from "../tryon/types.js";

// Sample shopper photos: listed for the try-on panel, generated or uploaded on the images page.
export const samplesRouter = Router();

const subjectParam = z.enum(["full_body", "face", "head_and_shoulders", "hand", "room"]);

async function listSamples() {
  const { rows } = await pool.query<{ subject: RequiredSubject; imageUrl: string }>(
    `SELECT subject, image_url AS "imageUrl" FROM sample_photos`,
  );
  const urls = new Map(rows.map((r) => [r.subject, r.imageUrl]));
  return (Object.keys(samplePhotoPrompts) as RequiredSubject[]).map((subject) => ({
    subject,
    label: samplePhotoPrompts[subject].label,
    prompt: samplePhotoPrompts[subject].prompt,
    imageUrl: urls.get(subject) ?? null,
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

samplesRouter.post("/admin/samples/:subject/generate", async (req, res) => {
  const subject = subjectParam.safeParse(req.params.subject);
  if (!subject.success) {
    res.status(400).json({ error: "Unknown sample photo" });
    return;
  }
  if (!useGemini) {
    res.status(409).json({ error: "Add GEMINI_API_KEY to .env and restart the backend to generate images" });
    return;
  }
  const { prompt, aspectRatio } = samplePhotoPrompts[subject.data];
  try {
    const result = await gemini().models.generateContent({
      model: config.GEMINI_IMAGE_MODEL,
      contents: prompt,
      config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio } },
    });
    const data = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
    if (blockReason(result) || !data) {
      res.status(422).json({ error: "Gemini did not return an image for this prompt. Please try again." });
      return;
    }
    res.json(await saveSample(subject.data, Buffer.from(data, "base64")));
  } catch (err) {
    console.error(`generating sample ${subject.data} failed`, err);
    res.status(502).json({ error: `Gemini request failed: ${(err as Error).message.slice(0, 200)}` });
  }
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
