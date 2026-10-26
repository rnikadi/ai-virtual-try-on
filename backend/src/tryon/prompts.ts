import type { TryOnProduct } from "./types.js";

// Image 1 is always the shopper's photo and image 2 the product photo.
const PREAMBLE = `You are the virtual try-on engine of an online store.
Image 1 is a photo uploaded by a shopper. Image 2 is the product photo of "{name}": {description}`;

const PERSON_RULES = `Keep the person exactly as they are: same face, identity, skin tone, hair, body shape, pose, expression and background.
Match the lighting, shadows, color temperature and camera angle of image 1 so the result looks like an unedited photograph.
Reproduce the product faithfully: same color, material, pattern, proportions and details as in image 2. Do not add logos or text.
Return only the edited version of image 1.`;

const ROOM_RULES = `Keep the room exactly as it is: same walls, floor, existing furniture, windows, camera angle and framing.
Match the room's perspective, lighting direction and color temperature, and add a soft contact shadow so the item sits naturally.
Reproduce the product faithfully: same color, material, shape and proportions as in image 2.
Return only the edited version of image 1.`;

const str = (value: unknown, fallback = "") => (value == null ? fallback : String(value));

function apparel(a: Record<string, unknown>): string {
  const garment = str(a.garment, "garment");
  const replaces =
    garment === "dress"
      ? "Replace the clothing the person is wearing with the dress, keeping their shoes and accessories."
      : `Dress the person in the ${garment}, replacing whatever they wear in the same place on the body and keeping the rest of their outfit.`;
  return `${replaces}
The ${garment} should have a ${str(a.fit, "regular")} fit sized to this person's body, with natural drape, folds and creases that follow their pose.`;
}

function eyewear(a: Record<string, unknown>): string {
  const lens = str(a.lens, "clear");
  const lensRule =
    lens === "clear"
      ? "The lenses are clear: the eyes must stay fully visible, with only faint natural reflections."
      : `The lenses have a ${lens}; show the eyes dimly through it as real tinted lenses would.`;
  return `Put the ${str(a.style)} frames from image 2 on the person's face, in ${str(a.frame_color)}.
Size the frames to the width of this person's face, rest the bridge on the nose, center the lenses on the eyes and run the temples back over the ears.
If the person already wears glasses, replace them. ${lensRule}`;
}

function jewelry(a: Record<string, unknown>): string {
  const material = str(a.material);
  switch (str(a.placement)) {
    case "ears":
      return `Put the ${material} earrings from image 2 on both earlobes, matched as a pair and at a realistic size. Leave hair covering an ear in place unless the earlobe is visible.`;
    case "neck":
      return `Put the ${material} necklace from image 2 around the person's neck, resting naturally on the collarbone and over or under their neckline as a real necklace would.`;
    case "wrist":
      return `Put the watch from image 2 on the person's wrist with the dial facing up toward the camera, sized realistically for this wrist.`;
    case "finger":
      return `Put the ${material} ring from image 2 on the person's ring finger, sized realistically for this hand and following the finger's angle.`;
    default:
      return `Put the accessory from image 2 on the person where it is normally worn, at a realistic size.`;
  }
}

function makeup(a: Record<string, unknown>): string {
  const shade = `${str(a.shade)}${a.hex ? ` (${str(a.hex)})` : ""}`;
  return `Apply ${str(a.type)} in the shade ${shade} with a ${str(a.finish, "natural")} finish to the person's ${str(a.area)} only.
Use image 2 only as a reference for the shade; do not place the product packaging in the photo.
Keep natural skin texture and the edges of the ${str(a.area)} crisp. Do not change any other features or add other makeup.`;
}

function home(a: Record<string, unknown>): string {
  const dims =
    a.width_cm && a.height_cm
      ? ` It is about ${str(a.width_cm)} cm wide, ${str(a.depth_cm, "?")} cm deep and ${str(a.height_cm)} cm tall, so scale it against nearby furniture, doors and floor tiles.`
      : "";
  return `Place the ${str(a.type, "item")} from image 2 into the room in image 1, standing on the floor in the most natural open spot.${dims}
Do not place it in front of doorways or overlapping existing furniture.`;
}

const instructions: Record<string, (a: Record<string, unknown>) => string> = {
  apparel,
  eyewear,
  jewelry,
  makeup,
  home,
};

export function buildTryOnPrompt(product: TryOnProduct): string {
  const build = instructions[product.categoryId];
  if (!build) throw new Error(`No try-on prompt for category ${product.categoryId}`);
  const preamble = PREAMBLE.replace("{name}", product.name).replace("{description}", product.description);
  const rules = product.categoryId === "home" ? ROOM_RULES : PERSON_RULES;
  return `${preamble}\n\n${build(product.attributes)}\n\n${rules}`;
}
