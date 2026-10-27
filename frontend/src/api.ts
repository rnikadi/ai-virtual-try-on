export type PhotoSubject = "full_body" | "face" | "face_or_hand" | "room";
export type RequiredPhoto = "full_body" | "face" | "head_and_shoulders" | "hand" | "room";

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
  requiredPhoto: RequiredPhoto;
}

export interface TryOnSession {
  id: string;
  productId: string;
  productName: string;
  categoryId: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  userImageUrl: string;
  resultImageUrl: string | null;
  model: string | null;
  latencyMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface AdminProduct {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  brand: string;
  description: string;
  imageUrl: string;
  attributes: Record<string, unknown>;
  imagePrompt: string;
  hasUploadedImage: boolean;
}

export interface SamplePhoto {
  subject: RequiredPhoto;
  label: string;
  prompt: string;
  imageUrl: string | null;
}

export interface Health {
  status: string;
  tryonMode: "gemini" | "mock";
  provider: "gemini-api" | "vertex" | null;
  imageModel: string;
}

async function readJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok && !(body && "status" in body)) {
    throw new Error((body as { error?: string }).error ?? `Request failed with ${res.status}`);
  }
  return body as T;
}

const getJson = <T>(url: string) => fetch(url).then((res) => readJson<T>(res));

export const api = {
  health: () => getJson<Health>("/api/health"),
  categories: () => getJson<Category[]>("/api/categories"),
  products: () => getJson<Product[]>("/api/products"),
  recentTryOns: (limit = 8) => getJson<TryOnSession[]>(`/api/tryon?limit=${limit}`),
  adminProducts: () => getJson<AdminProduct[]>("/api/admin/products"),
  uploadProductImage: (productId: string, image: File) => {
    const form = new FormData();
    form.append("image", image);
    return fetch(`/api/admin/products/${productId}/image`, { method: "POST", body: form }).then((res) =>
      readJson<AdminProduct>(res),
    );
  },
  resetProductImage: (productId: string) =>
    fetch(`/api/admin/products/${productId}/image`, { method: "DELETE" }).then((res) => readJson<AdminProduct>(res)),
  samples: () => getJson<SamplePhoto[]>("/api/samples"),
  uploadSample: (subject: RequiredPhoto, image: File) => {
    const form = new FormData();
    form.append("image", image);
    return fetch(`/api/admin/samples/${subject}`, { method: "POST", body: form }).then((res) =>
      readJson<SamplePhoto>(res),
    );
  },
  /** Downloads an image from the API as a File, so a sample photo goes through the same flow as an upload. */
  fetchAsFile: async (url: string, name: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load ${url}`);
    const blob = await res.blob();
    return new File([blob], name, { type: blob.type || "image/jpeg" });
  },
  /** Resolves with the session for both successful and failed try-ons. */
  tryOn: (productId: string, photo: File) => {
    const form = new FormData();
    form.append("productId", productId);
    form.append("photo", photo);
    return fetch("/api/tryon", { method: "POST", body: form }).then((res) => readJson<TryOnSession>(res));
  },
};

export const formatPrice = (p: Product) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: p.currency }).format(p.priceCents / 100);
