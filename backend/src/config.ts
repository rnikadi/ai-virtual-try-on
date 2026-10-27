import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url().default("postgres://tryon:tryon@localhost:5432/tryon"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // gemini-api: Google AI Studio key. vertex: Vertex AI (Gemini Enterprise Agent Platform) API key,
  // which bills through your Google Cloud project.
  GEMINI_PROVIDER: z.enum(["gemini-api", "vertex"]).default("gemini-api"),
  GEMINI_API_KEY: z.string().optional(),
  // Optional override of the Gemini API endpoint, e.g. for a corporate proxy or a local test stub.
  GEMINI_BASE_URL: z.string().url().optional(),
  // Model that edits the shopper's photo.
  GEMINI_IMAGE_MODEL: z.string().default("gemini-3.1-flash-image"),
  // Cheap vision model that checks the uploaded photo suits the product before we pay for an image.
  GEMINI_CHECK_MODEL: z.string().default("gemini-3.1-flash-lite"),
  // auto: use Gemini when a key is set, otherwise the mock generator.
  TRYON_MODE: z.enum(["auto", "gemini", "mock"]).default("auto"),
  PHOTO_CHECK: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export const config = schema.parse(process.env);

export const useGemini =
  config.TRYON_MODE === "gemini" || (config.TRYON_MODE === "auto" && Boolean(config.GEMINI_API_KEY));
