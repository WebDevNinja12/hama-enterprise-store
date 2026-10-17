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
  /** @deprecated use image */
  emoji?: string;
  image: string;
  stock: number;
};

export const products: Product[] = [
  {
    id: "1",
    name: "Synapse-X Headset",
    slug: "synapse-x",
    price: 1299,
    compareAt: 1499,
    rating: 4.9,
    category: "Neural",
    brand: "Nexus Core",
    description:
      "Neural-interface headset with sub-millisecond latency, spatial audio, and adaptive noise cancelation for immersive work and play.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    stock: 24,
  },
  {
    id: "2",
    name: "HoloLens Pro 3",
    slug: "hololens-pro-3",
    price: 849,
    rating: 4.8,
    category: "Optics",
    brand: "AetherDynamics",
    description:
      "Next-gen mixed reality optics with 8K per-eye micro OLED and all-day battery for spatial computing.",
    image:
      "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=800&q=80",
    stock: 18,
  },
  {
    id: "3",
    name: "Q-Cube Core V2",
    slug: "q-cube-core-v2",
    price: 3499,
    rating: 5.0,
    category: "Quantum",
    brand: "Vanguard Labs",
    description:
      "Desktop quantum processing unit for advanced simulation, cryptography, and AI workloads.",
    image:
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
    stock: 6,
  },
  {
    id: "4",
    name: "Titan Arm Bracer",
    slug: "titan-arm-bracer",
    price: 2150,
    rating: 4.7,
    category: "Exosuit",
    brand: "Nexus Core",
    description:
      "Powered arm bracer with haptic feedback and strength assist for industrial and field use.",
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
    stock: 12,
  },
  {
    id: "5",
    name: "NeuroLink Node Mini",
    slug: "neurolink-node-mini",
    price: 499,
    rating: 4.6,
    category: "Neural",
    brand: "AetherDynamics",
    description:
      "Compact neural interface node for focus, sleep tracking, and ambient computing control.",
    image:
      "https://images.unsplash.com/photo-1558082410-8d2cd8c8f0e4?auto=format&fit=crop&w=800&q=80",
    stock: 40,
  },
  {
    id: "6",
    name: "Vision-X Contacts",
    slug: "vision-x-contacts",
    price: 1599,
    rating: 4.9,
    category: "Optics",
    brand: "Vanguard Labs",
    description:
      "Smart contact lenses with AR overlay, health sensors, and discreet always-on display.",
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
    stock: 15,
  },
  {
    id: "7",
    name: "AuraBuds Pro Neural",
    slug: "aurabuds-pro",
    price: 299,
    rating: 4.8,
    category: "Audio",
    brand: "HAMA",
    description:
      "Spatial earbuds with neural noise cancelation and adaptive EQ for studio-grade listening.",
    image:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    stock: 55,
  },
  {
    id: "8",
    name: "Nexus Ring Gen-3",
    slug: "nexus-ring-gen-3",
    price: 349,
    rating: 4.7,
    category: "Wearables",
    brand: "HAMA",
    description:
      "Smart ring with biometrics, payments, and two-week battery life in a titanium shell.",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
    stock: 30,
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function productImage(p: { image?: string; emoji?: string; name?: string }) {
  return (
    p.image ||
    `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80`
  );
}
