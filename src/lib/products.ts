/** Shared product type + image helper. No demo/seed catalog. */

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAt?: number;
  rating: number;
  category: string;
  brand: string;
  description: string;
  emoji?: string;
  image: string;
  imageUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
  stock: number;
};

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80";

/** Use product imageUrl/image only — never invent a product photo */
export function productImage(p: {
  image?: string | null;
  imageUrl?: string | null;
}) {
  const url = (p.imageUrl || p.image || "").trim();
  if (
    url &&
    (url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/"))
  ) {
    return url;
  }
  return PLACEHOLDER;
}

/** @deprecated No seed catalog — always empty */
export const products: Product[] = [];

export function getProductBySlug(_slug: string): Product | undefined {
  return undefined;
}

export function getProductById(_id: string): Product | undefined {
  return undefined;
}
