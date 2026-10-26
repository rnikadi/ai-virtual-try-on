import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const assetsDir = path.join(backendDir, "assets");
export const uploadsDir = path.join(backendDir, "uploads");
