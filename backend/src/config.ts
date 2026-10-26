import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url().default("postgres://tryon:tryon@localhost:5432/tryon"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  GEMINI_API_KEY: z.string().optional(),
});

export const config = schema.parse(process.env);
