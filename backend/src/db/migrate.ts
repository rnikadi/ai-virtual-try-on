import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pool } from "./pool.js";
import { migrationsDir } from "./paths.js";

const RETRYABLE = new Set(["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "57P03"]);

// Waits up to ~30s for Postgres to accept connections, so a database that is still starting
// (or a container DNS name that is not registered yet) doesn't fail the migration outright.
async function waitForDatabase(attempts = 15): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (!RETRYABLE.has(code) || attempt >= attempts) throw err;
      console.log(`database not reachable yet (${code}), retrying (${attempt}/${attempts})`);
      await delay(2000);
    }
  }
}

// Applies every db/migrations/*.sql file not yet recorded in schema_migrations,
// in filename order, each inside its own transaction.
export async function migrate(): Promise<void> {
  await waitForDatabase();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query<{ name: string }>("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`migration ${file} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => console.log("migrations up to date"))
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
