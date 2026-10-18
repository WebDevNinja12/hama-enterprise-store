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
  stock: number;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80";

/** Prefer explicit imageUrl / image — never invent a random product photo */
export function productImage(p: {
  image?: string | null;
  imageUrl?: string | null;
  emoji?: string;
  name?: string;
}) {
  const url = (p.imageUrl || p.image || "").trim();
  if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"))) {
    return url;
  }
  return FALLBACK_IMAGE;
}

/**
 * Real HAMA ENTERPRISE NG catalog (physical goods).
 * Used only as fallback when the database has no published products yet.
 */
export const products: Product[] = [
  {
    id: "real-1",
    name: "Industrial Safety Helmet",
    slug: "industrial-safety-helmet",
    price: 45,
    rating: 4.8,
    category: "Safety",
    brand: "HAMA",
    description:
      "Hard hat for construction and site work. Adjustable fit, impact-resistant shell, compliant with common site safety standards.",
    image:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
    stock: 120,
  },
  {
    id: "real-2",
    name: "Heavy-Duty Work Gloves (Pair)",
    slug: "heavy-duty-work-gloves",
    price: 18,
    rating: 4.7,
    category: "Safety",
    brand: "HAMA",
    description:
      "Durable gloves for warehouse and field use. Reinforced palm, good grip for tools and materials handling.",
    image:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
    stock: 200,
  },
  {
    id: "real-3",
    name: "Power Drill 18V Kit",
    slug: "power-drill-18v-kit",
    price: 189,
    compareAt: 220,
    rating: 4.9,
    category: "Tools",
    brand: "HAMA",
    description:
      "Cordless drill kit with battery and charger. Suitable for wood, metal, and general site installation work.",
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
    stock: 35,
  },
  {
    id: "real-4",
    name: "Steel Measuring Tape 5m",
    slug: "steel-measuring-tape-5m",
    price: 12,
    rating: 4.6,
    category: "Tools",
    brand: "HAMA",
    description:
      "5-metre steel tape with lock button and belt clip. Clear markings for accurate site measurements.",
    image:
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80",
    stock: 150,
  },
  {
    id: "real-5",
    name: "LED Work Flood Light",
    slug: "led-work-flood-light",
    price: 65,
    rating: 4.7,
    category: "Electrical",
    brand: "HAMA",
    description:
      "Bright portable LED flood light for workshops and outdoor jobs. Stand mount and durable housing.",
    image:
      "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=800&q=80",
    stock: 48,
  },
  {
    id: "real-6",
    name: "Extension Cable 20m",
    slug: "extension-cable-20m",
    price: 38,
    rating: 4.5,
    category: "Electrical",
    brand: "HAMA",
    description:
      "Heavy-duty 20-metre extension cable for site power. Suitable for tools and temporary lighting.",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    stock: 80,
  },
  {
    id: "real-7",
    name: "Cement Mixer 120L",
    slug: "cement-mixer-120l",
    price: 420,
    rating: 4.8,
    category: "Machinery",
    brand: "HAMA",
    description:
      "120-litre drum mixer for small to medium concrete jobs. Portable frame for site mobility.",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    stock: 10,
  },
  {
    id: "real-8",
    name: "Wheelbarrow Heavy Duty",
    slug: "wheelbarrow-heavy-duty",
    price: 95,
    rating: 4.6,
    category: "Machinery",
    brand: "HAMA",
    description:
      "Steel tray wheelbarrow for sand, cement, and site debris. Puncture-resistant wheel.",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112c4e5190?auto=format&fit=crop&w=800&q=80",
    stock: 25,
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}
