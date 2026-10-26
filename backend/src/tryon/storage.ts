import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { uploadsDir } from "../paths.js";

const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Saves an image under uploads/<folder>/ and returns its public /uploads/... path. */
export async function saveImage(folder: "inputs" | "results", name: string, data: Buffer, mimeType: string) {
  const dir = path.join(uploadsDir, folder);
  await mkdir(dir, { recursive: true });
  const file = `${name}.${extensions[mimeType] ?? "png"}`;
  await writeFile(path.join(dir, file), data);
  return `/uploads/${folder}/${file}`;
}
