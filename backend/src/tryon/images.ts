import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { assetsDir } from "../paths.js";
import type { PreparedImage } from "./types.js";

const MAX_SIDE = 1536;

/** Applies EXIF rotation, caps the long side and re-encodes as JPEG so uploads are small and predictable. */
export async function prepareUpload(input: Buffer): Promise<PreparedImage> {
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer({ resolveWithObject: true });
  return { data, mimeType: "image/jpeg", width: info.width, height: info.height };
}

/** Loads a catalog image referenced as /assets/... from the backend assets folder. */
export async function loadProductImage(imageUrl: string): Promise<PreparedImage> {
  if (!imageUrl.startsWith("/assets/")) throw new Error(`Unsupported product image url ${imageUrl}`);
  const file = path.join(assetsDir, path.normalize(imageUrl.slice("/assets/".length)));
  if (!file.startsWith(assetsDir)) throw new Error(`Product image outside assets: ${imageUrl}`);
  const input = await readFile(file);
  const { data, info } = await sharp(input).png().toBuffer({ resolveWithObject: true });
  return { data, mimeType: "image/png", width: info.width, height: info.height };
}

const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];

/** The supported output aspect ratio closest to the shopper's photo, so the framing is preserved. */
export function closestAspectRatio(width: number, height: number): string {
  const target = Math.log(width / height);
  let best = ASPECT_RATIOS[0];
  let bestDistance = Infinity;
  for (const ratio of ASPECT_RATIOS) {
    const [w, h] = ratio.split(":").map(Number);
    const distance = Math.abs(Math.log(w / h) - target);
    if (distance < bestDistance) {
      best = ratio;
      bestDistance = distance;
    }
  }
  return best;
}
