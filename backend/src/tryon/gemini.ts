import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { config } from "../config.js";

let client: GoogleGenAI | undefined;

export function gemini(): GoogleGenAI {
  if (!config.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({
    apiKey: config.GEMINI_API_KEY,
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
