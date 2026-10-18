"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Star, ShoppingCart, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { productImage, type Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import SafeImage from "@/components/SafeImage";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.product) {
          const p = data.product;
          const img = productImage({
            imageUrl: p.imageUrl,
            image: p.image,
          });
          setProduct({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            compareAt: p.compareAt != null ? Number(p.compareAt) : undefined,
            rating: p.rating ?? 5,
            category: p.category,
            brand: p.brand || "HAMA",
            description: p.description || "",
            image: img,
            imageUrl: p.imageUrl || img,
            stock: p.stock ?? 0,
          });
        } else {
          setProduct(null);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-[var(--muted)]">
        Loading product…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--heading)]">
          Product not found
        </h1>
        <Link href="/catalog" className="text-cyan-400 hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  function handleAdd() {
    if (!product) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    if (!product) return;
    addItem(product, qty);
    router.push("/checkout");
  }

  const img = productImage(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/catalog"
        className="mb-6 inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Catalog
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="card relative aspect-square overflow-hidden">
          <SafeImage
            src={img}
            alt={product.name}
            fill
            useFill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div>
          <span className="badge badge-cyan mb-3">{product.category}</span>
          <h1 className="mb-2 text-3xl font-bold text-[var(--heading)]">
            {product.name}
          </h1>
          <p className="mb-1 text-sm text-[var(--muted)]">{product.brand}</p>
          <div className="mb-4 flex items-center gap-1 text-sm text-cyan-400">
            <Star className="h-4 w-4 fill-current" />
            {product.rating} · {product.stock} in stock
          </div>

          <div className="mb-6 flex items-baseline gap-3">
            <p className="text-3xl font-bold text-cyan-400">
              ${product.price.toLocaleString()}
            </p>
            {product.compareAt && (
              <p className="text-lg text-[var(--muted)] line-through">
                ${product.compareAt.toLocaleString()}
              </p>
            )}
          </div>

          <p className="mb-8 leading-relaxed text-[var(--muted)]">
            {product.description}
          </p>

          <div className="mb-6 flex items-center gap-4">
            <label className="text-sm text-[var(--muted)]">Quantity</label>
            <div className="flex items-center rounded-lg border border-[var(--border)]">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-2 text-[var(--heading)] hover:bg-white/5"
              >
                −
              </button>
              <span className="w-10 text-center text-[var(--heading)]">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                className="px-3 py-2 text-[var(--heading)] hover:bg-white/5"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm disabled:opacity-40"
            >
              <ShoppingCart className="h-4 w-4" />
              {product.stock <= 0
                ? "Out of stock"
                : added
                  ? "Added to cart!"
                  : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="btn-secondary rounded-xl px-6 py-3 text-sm disabled:opacity-40"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
