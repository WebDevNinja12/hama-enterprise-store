"use client";

import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { products as seedProducts, type Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";

export default function CatalogPage() {
  const { addItem, getQtyInCart } = useCart();
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState<{ id: string; text: string } | null>(
    null
  );
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.products || []).map(
          (p: Product & { id: string }) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            compareAt: p.compareAt ? Number(p.compareAt) : undefined,
            rating: p.rating ?? 5,
            category: p.category,
            brand: p.brand || "HAMA",
            description: p.description || "",
            emoji: p.emoji || "📦",
            stock: p.stock ?? 0,
          })
        );
        setDbProducts(list);
      })
      .catch(() => {});
  }, []);

  const allProducts = useMemo(() => {
    const ids = new Set(dbProducts.map((p) => p.slug));
    const seeds = seedProducts.filter((p) => !ids.has(p.slug));
    return [...dbProducts, ...seeds];
  }, [dbProducts]);

  const categories = useMemo(() => {
    const set = new Set(allProducts.map((p) => p.category));
    return ["All", ...Array.from(set).sort()];
  }, [allProducts]);

  const filtered = useMemo(() => {
    if (category === "All") return allProducts;
    return allProducts.filter((p) => p.category === category);
  }, [category, allProducts]);

  function flash(id: string, text: string) {
    setMessage({ id, text });
    setTimeout(() => setMessage(null), 2500);
  }

  function handleAdd(product: Product) {
    if (product.stock <= 0) {
      flash(product.id, "Out of stock — max reached");
      fetch("/api/stock/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.name,
          productId: product.id,
          stock: 0,
          reason: "out_of_stock",
        }),
      }).catch(() => {});
      return;
    }

    const result = addItem(product);
    if (!result.ok) {
      if (result.reason === "max_reached") {
        flash(product.id, `Max stock reached (${product.stock} available)`);
        fetch("/api/stock/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: product.name,
            productId: product.id,
            stock: product.stock,
            reason: "max_reached",
          }),
        }).catch(() => {});
      } else {
        flash(product.id, "Out of stock");
      }
      return;
    }

    if (result.atMax) {
      flash(product.id, `Added — cart is at max (${product.stock})`);
    } else {
      flash(product.id, "Added to cart");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">
          Hardware Catalog / 2026 Edition
        </p>
        <h1 className="text-3xl font-bold text-[var(--heading)]">
          Advanced Tech Inventory
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {filtered.length} products
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              category === c
                ? "bg-cyan-500 text-black"
                : "border border-[var(--border)] text-[var(--muted)] hover:border-cyan-500/50 hover:text-cyan-400"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const inCart = getQtyInCart(p.id);
          const atMax = p.stock > 0 && inCart >= p.stock;
          const soldOut = p.stock <= 0;

          return (
            <div key={p.id} className="card group overflow-hidden">
              <Link href={`/product/${p.slug}`}>
                <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-cyan-500/10 to-[var(--surface)] text-5xl">
                  <span className="absolute left-3 top-3 badge badge-cyan text-[10px]">
                    {p.category.toUpperCase()}
                  </span>
                  {soldOut && (
                    <span className="absolute right-3 top-3 badge badge-danger text-[10px]">
                      SOLD OUT
                    </span>
                  )}
                  {!soldOut && atMax && (
                    <span className="absolute right-3 top-3 badge badge-warning text-[10px]">
                      MAX IN CART
                    </span>
                  )}
                  {p.emoji}
                </div>
              </Link>
              <div className="p-4">
                <p className="text-xs text-[var(--muted)]">{p.brand}</p>
                <Link href={`/product/${p.slug}`}>
                  <h3 className="mb-1 font-semibold text-[var(--heading)] group-hover:text-cyan-400">
                    {p.name}
                  </h3>
                </Link>
                <div className="mb-1 flex items-center gap-1 text-xs text-cyan-400">
                  <Star className="h-3 w-3 fill-current" />
                  {p.rating}
                </div>
                <p className="mb-2 text-xs text-[var(--muted)]">
                  Stock: {p.stock}
                  {inCart > 0 ? ` · In cart: ${inCart}` : ""}
                </p>
                {message?.id === p.id && (
                  <p
                    className={`mb-2 text-xs font-medium ${
                      message.text.includes("Max") ||
                      message.text.includes("Out")
                        ? "text-amber-400"
                        : "text-cyan-400"
                    }`}
                  >
                    {message.text}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-[var(--heading)]">
                      ${p.price.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(p)}
                    disabled={soldOut || atMax}
                    className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {soldOut
                      ? "Max reached"
                      : atMax
                        ? "Max in cart"
                        : "Add"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
