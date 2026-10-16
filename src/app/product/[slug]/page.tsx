"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Star, ShoppingCart, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { getProductBySlug } from "@/lib/products";
import { useCart } from "@/context/CartContext";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const product = getProductBySlug(slug);
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold text-white">Product not found</h1>
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/catalog"
        className="mb-6 inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Catalog
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="card flex aspect-square items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-8xl">
          {product.emoji}
        </div>

        <div>
          <span className="badge badge-cyan mb-3">{product.category}</span>
          <h1 className="mb-2 text-3xl font-bold text-white">{product.name}</h1>
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
                className="px-3 py-2 text-white hover:bg-white/5"
              >
                −
              </button>
              <span className="w-10 text-center text-white">{qty}</span>
              <button
                onClick={() => setQty(Math.min(99, qty + 1))}
                className="px-3 py-2 text-white hover:bg-white/5"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAdd}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              {added ? "Added to cart!" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              className="btn-secondary rounded-xl px-6 py-3 text-sm"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
