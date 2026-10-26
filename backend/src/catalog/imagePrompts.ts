// Prompts for producing catalog product photos in an image tool of your choice (Gemini app,
// AI Studio, etc.). The catalog page shows them next to an upload button. The framing asked for
// here is what the try-on engine works best with: the whole product, unobstructed, on a plain background.

interface ProductForPrompt {
  categoryId: string;
  name: string;
  description: string;
  attributes: Record<string, unknown>;
}

const framing: Record<string, string> = {
  apparel:
    "Show the garment on its own as a ghost-mannequin shot, front view, the whole garment in frame including sleeves and hem, no person or visible mannequin.",
  eyewear:
    "Show the glasses straight on from the front with the temples unfolded, both lenses fully visible, at eye level.",
  jewelry:
    "Show the piece on its own, front view, close enough that the material and details are crisp, with the whole piece in frame.",
  makeup:
    "Show the product with its cap off and the colour clearly visible, plus a small swatch of the shade beside it.",
  home: "Show the whole item in a three-quarter view, standing on the floor, with nothing cropped.",
};

function details(attributes: Record<string, unknown>): string {
  const parts = Object.entries(attributes).map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`);
  return parts.length ? `Details: ${parts.join("; ")}.` : "";
}

export function productImagePrompt(product: ProductForPrompt): string {
  return [
    `Professional e-commerce product photo of "${product.name}": ${product.description}`,
    details(product.attributes),
    framing[product.categoryId] ?? "Show the whole product, front view.",
    "Plain light grey studio background, soft even lighting, sharp focus, square 1:1 image.",
    "No people, hands, text, logos, watermarks or props.",
  ]
    .filter(Boolean)
    .join("\n");
}
