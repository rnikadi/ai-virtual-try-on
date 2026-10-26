import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool.js";
import { seedsDir } from "./paths.js";

// Runs every db/seeds/*.sql file in order. Seed files are written to be re-runnable.
export async function seed(): Promise<void> {
  const files = (await readdir(seedsDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await pool.query(await readFile(path.join(seedsDir, file), "utf8"));
    console.log(`seeded ${file}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
