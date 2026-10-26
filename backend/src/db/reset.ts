import { pool } from "./pool.js";
import { migrate } from "./migrate.js";
import { seed } from "./seed.js";

// Drops everything in the public schema, then migrates and seeds from scratch.
// Local development only.
async function reset(): Promise<void> {
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await migrate();
  await seed();
}

reset()
  .then(() => console.log("database reset"))
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
