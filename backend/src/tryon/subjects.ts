import type { RequiredSubject, TryOnProduct } from "./types.js";

export function requiredSubject(product: TryOnProduct): RequiredSubject {
  if (product.categorySubject !== "face_or_hand") return product.categorySubject;
  const placement = String(product.attributes.placement ?? "");
  return placement === "finger" || placement === "wrist" ? "hand" : "head_and_shoulders";
}

export const subjectDescriptions: Record<RequiredSubject, string> = {
  full_body: "a person shown from the head down to at least the knees",
  face: "a single person's face, front-facing and clearly visible",
  head_and_shoulders: "a single person's head, ears and neck clearly visible",
  hand: "a person's hand with the fingers and wrist clearly visible",
  room: "the interior of a room with visible floor space",
};
