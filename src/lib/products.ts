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
  emoji: string;
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
    emoji: "\ud83e\udde0",
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
    emoji: "\ud83d\udc41\ufe0f",
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
    emoji: "\u269b\ufe0f",
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
    emoji: "\ud83e\uddbe",
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
    emoji: "\ud83d\udce1",
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
    emoji: "\ud83d\udc53",
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
    emoji: "\ud83c\udfa7",
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
    emoji: "\ud83d\udc8d",
    stock: 30,
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}
