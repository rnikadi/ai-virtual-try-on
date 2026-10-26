import { Type } from "@google/genai";
import { config, useGemini } from "../config.js";
import { gemini } from "./gemini.js";
import { subjectDescriptions } from "./subjects.js";
import { type PreparedImage, type RequiredSubject, TryOnRejection } from "./types.js";

const tips: Record<RequiredSubject, string> = {
  full_body: "Try a front-facing photo that shows you from head to at least the knees.",
  face: "Try a well-lit, front-facing photo of your face.",
  head_and_shoulders: "Try a head-and-shoulders photo with your ears and neck visible.",
  hand: "Try a clear photo of your hand with your fingers and wrist visible.",
  room: "Try a wide photo of the room, taken at eye level.",
};

/**
 * Asks a cheap vision model whether the photo suits this kind of try-on, so a wrong photo
 * gets a helpful message instead of a paid, poor-quality image. Throws TryOnRejection on a mismatch.
 */
export async function checkPhoto(photo: PreparedImage, subject: RequiredSubject): Promise<void> {
  if (!config.PHOTO_CHECK || !useGemini) return;

  const res = await gemini().models.generateContent({
    model: config.GEMINI_CHECK_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `A shopper uploaded this photo for a virtual try-on. It should show ${subjectDescriptions[subject]}.
Is it suitable? Answer suitable=false only if the required subject is missing, cut off, much too small or too blurry or dark to edit.
If unsuitable, give a one-sentence reason addressed to the shopper.`,
          },
          { inlineData: { mimeType: photo.mimeType, data: photo.data.toString("base64") } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { suitable: { type: Type.BOOLEAN }, reason: { type: Type.STRING } },
        required: ["suitable"],
      },
    },
  });

  // Fail open: if the checker itself misbehaves, let the try-on attempt go ahead.
  let verdict: { suitable?: boolean; reason?: string };
  try {
    verdict = JSON.parse(res.text ?? "{}");
  } catch {
    return;
  }
  if (verdict.suitable === false) {
    throw new TryOnRejection(`${verdict.reason ?? "This photo doesn't suit this product."} ${tips[subject]}`, "photo_mismatch");
  }
}
