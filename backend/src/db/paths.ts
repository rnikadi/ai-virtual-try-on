import path from "node:path";
import { fileURLToPath } from "node:url";

// Repo-level db/ folder holding the SQL migration and seed scripts.
export const dbDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../db");
export const migrationsDir = path.join(dbDir, "migrations");
export const seedsDir = path.join(dbDir, "seeds");
