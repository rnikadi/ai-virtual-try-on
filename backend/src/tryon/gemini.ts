import { GoogleGenAI, Modality, type GenerateContentResponse } from "@google/genai";
import { config } from "../config.js";

let client: GoogleGenAI | undefined;

export function gemini(): GoogleGenAI {
  if (!config.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({
    apiKey: config.GEMINI_API_KEY,
    // With an API key and no project or location, the SDK uses Vertex AI express mode.
    enterprise: config.GEMINI_PROVIDER === "vertex",
    httpOptions: config.GEMINI_BASE_URL ? { baseUrl: config.GEMINI_BASE_URL } : undefined,
  });
  return client;
}

const BLOCKED_REASONS = new Set([
  "SAFETY",
  "IMAGE_SAFETY",
  "PROHIBITED_CONTENT",
  "IMAGE_PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
]);

/** Why Gemini refused to answer, or undefined if it did not. */
export function blockReason(res: GenerateContentResponse): string | undefined {
  if (res.promptFeedback?.blockReason) return res.promptFeedback.blockReason;
  const finish = res.candidates?.[0]?.finishReason;
  return finish && BLOCKED_REASONS.has(finish) ? finish : undefined;
}

/** Generates one image from a text prompt with the configured Gemini image model. */
export async function generateImageFromText(prompt: string, aspectRatio: string): Promise<Buffer> {
  const res = await gemini().models.generateContent({
    model: config.GEMINI_IMAGE_MODEL,
    contents: prompt,
    config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio } },
  });
  const reason = blockReason(res);
  if (reason) throw new Error(`Gemini declined the prompt (${reason})`);
  const data = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!data) throw new Error("Gemini returned no image");
  return Buffer.from(data, "base64");
}
