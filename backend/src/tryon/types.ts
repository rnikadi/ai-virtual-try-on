export type CategorySubject = "full_body" | "face" | "face_or_hand" | "room";

// What the shopper's photo must actually show for a given product.
export type RequiredSubject = "full_body" | "face" | "head_and_shoulders" | "hand" | "room";

export interface TryOnProduct {
  id: string;
  categoryId: string;
  categorySubject: CategorySubject;
  name: string;
  description: string;
  imageUrl: string;
  attributes: Record<string, unknown>;
}

export interface PreparedImage {
  data: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

export interface GeneratedImage {
  data: Buffer;
  mimeType: string;
  model: string;
}

/** A try-on failed for a reason the shopper can act on (wrong photo, content declined). */
export class TryOnRejection extends Error {
  constructor(
    message: string,
    readonly code: "photo_mismatch" | "content_blocked" | "no_image",
  ) {
    super(message);
  }
}
