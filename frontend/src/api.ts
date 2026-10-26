export type PhotoSubject = "full_body" | "face" | "face_or_hand" | "room";

export interface Category {
  id: string;
  name: string;
  description: string;
  photoSubject: PhotoSubject;
  photoGuidance: string;
}

export interface Product {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  brand: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  attributes: Record<string, unknown>;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  categories: () => getJson<Category[]>("/api/categories"),
  products: (category?: string) =>
    getJson<Product[]>(category ? `/api/products?category=${encodeURIComponent(category)}` : "/api/products"),
};
