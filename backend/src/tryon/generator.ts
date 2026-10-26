import { setTimeout as delay } from "node:timers/promises";
import { Modality } from "@google/genai";
import sharp from "sharp";
import { config, useGemini } from "../config.js";
import { blockReason, gemini } from "./gemini.js";
import { closestAspectRatio } from "./images.js";
import { type GeneratedImage, type PreparedImage, TryOnRejection } from "./types.js";

export interface GenerateInput {
  prompt: string;
  photo: PreparedImage;
  product: PreparedImage;
}

export interface TryOnGenerator {
  readonly name: string;
  generate(input: GenerateInput): Promise<GeneratedImage>;
}

const inline = (image: PreparedImage) => ({
  inlineData: { mimeType: image.mimeType, data: image.data.toString("base64") },
});

export const geminiGenerator: TryOnGenerator = {
  name: config.GEMINI_IMAGE_MODEL,
  async generate({ prompt, photo, product }) {
    const res = await gemini().models.generateContent({
      model: config.GEMINI_IMAGE_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }, inline(photo), inline(product)] }],
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: { aspectRatio: closestAspectRatio(photo.width, photo.height) },
      },
    });

    const blocked = blockReason(res);
    if (blocked) {
      throw new TryOnRejection(
        "Gemini declined to edit this photo. Please try a different photo.",
        "content_blocked",
      );
    }
    const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data) {
      throw new TryOnRejection("Gemini did not return an image. Please try again.", "no_image");
    }
    return {
      data: Buffer.from(part.inlineData.data, "base64"),
      mimeType: part.inlineData.mimeType ?? "image/png",
      model: config.GEMINI_IMAGE_MODEL,
    };
  },
};

/**
 * Stand-in used until a Gemini key is configured: overlays the product thumbnail on the
 * shopper's photo with a "mock" label, after a short delay that mimics real latency.
 */
export const mockGenerator: TryOnGenerator = {
  name: "mock",
  async generate({ photo, product }) {
    await delay(1200);
    const thumb = Math.round(Math.min(photo.width, photo.height) * 0.35);
    const productThumb = await sharp(product.data).resize(thumb, thumb, { fit: "cover" }).png().toBuffer();
    const banner = Buffer.from(
      `<svg width="${photo.width}" height="60" xmlns="http://www.w3.org/2000/svg">
         <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)"/>
         <text x="50%" y="38" font-family="sans-serif" font-size="24" fill="#fff" text-anchor="middle">MOCK PREVIEW - add GEMINI_API_KEY for real try-on</text>
       </svg>`,
    );
    const data = await sharp(photo.data)
      .composite([
        { input: productThumb, gravity: "southeast" },
        { input: banner, gravity: "north" },
      ])
      .jpeg({ quality: 85 })
      .toBuffer();
    return { data, mimeType: "image/jpeg", model: "mock" };
  },
};

export const generator: TryOnGenerator = useGemini ? geminiGenerator : mockGenerator;
