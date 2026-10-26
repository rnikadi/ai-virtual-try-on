import type { RequiredSubject } from "../tryon/types.js";

// Prompts for the demo's sample shopper photos. They describe fictional people and rooms framed
// the way each kind of try-on needs, with plain clothing and nothing that the product would replace.
export const samplePhotoPrompts: Record<RequiredSubject, { label: string; aspectRatio: string; prompt: string }> = {
  full_body: {
    label: "Full body",
    aspectRatio: "3:4",
    prompt: `Photorealistic full-body photo of a fictional adult woman in her early thirties standing upright and facing the camera, arms relaxed at her sides.
She wears a plain fitted white t-shirt, dark blue jeans and white sneakers. Her whole body is visible from head to feet.
Plain light grey wall behind her, soft natural daylight, shot at chest height with a 50mm lens. No text, logos or watermarks.`,
  },
  face: {
    label: "Face",
    aspectRatio: "4:5",
    prompt: `Photorealistic front-facing portrait of a fictional adult man in his late twenties looking straight at the camera with a relaxed neutral expression.
Short hair, clear view of his eyes, eyebrows, nose and lips, no glasses, no makeup, no beard. Head and top of the shoulders in frame.
Plain off-white background, soft even window light. No text, logos or watermarks.`,
  },
  head_and_shoulders: {
    label: "Ears and neck",
    aspectRatio: "4:5",
    prompt: `Photorealistic head-and-shoulders portrait of a fictional adult woman facing the camera with a slight smile.
Her hair is tied back so both ears and earlobes are fully visible, and her neck and collarbone are bare above a plain black scoop-neck top.
She wears no jewelry. Plain light beige background, soft studio lighting. No text, logos or watermarks.`,
  },
  hand: {
    label: "Hand",
    aspectRatio: "4:3",
    prompt: `Photorealistic close-up photo of a fictional adult's left hand resting flat on a light wooden table, back of the hand toward the camera, fingers slightly apart.
The wrist and the lower part of the forearm are visible and bare. No rings, watch, bracelet or nail polish.
Soft natural daylight from the side, shot from above. No text, logos or watermarks.`,
  },
  room: {
    label: "Room",
    aspectRatio: "4:3",
    prompt: `Photorealistic wide photo of a bright, modern living room taken at eye level from the doorway.
A light grey sofa against the back wall, a low wooden coffee table, light oak floor and a large window on the left.
There is a clearly empty area of floor in the right corner of the room. Natural daylight. No people, text, logos or watermarks.`,
  },
};
