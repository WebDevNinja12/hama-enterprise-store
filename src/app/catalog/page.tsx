"use client";

import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { productImage, type Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import SafeImage from "@/components/SafeImage";

function CatalogInner() {
  const { addItem, getQtyInCart } = useCart();
  const { format, formatBoth, currency } = useCurrency();
  const searchParams = useSearchParams();
  const qParam = (searchParams.get("q") || "").trim().toLowerCase();
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState<{ id: string; text: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.products || []).map(
          (p: Product & { imageUrl?: string }) => {
            const img = productImage({
              imageUrl: p.imageUrl,
              image: p.image,
            });
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: Number(p.price),
              compareAt: p.compareAt ? Number(p.compareAt) : undefined,
              rating: p.rating ?? 5,
              category: p.category,
              brand: p.brand || "HAMA",
              description: p.description || "",
              image: img,
              imageUrl: p.imageUrl || img,
              stock: p.stock ?? 0,
            };
          }
        );
        setProducts(list);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (qParam) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(qParam) ||
          p.category.toLowerCase().includes(qParam) ||
          p.brand.toLowerCase().includes(qParam) ||
          p.description.toLowerCase().includes(qParam)
      );
    }
    return list;
  }, [category, products, qParam]);

  function flash(id: string, text: string) {
    setMessage({ id, text });
    setTimeout(() => setMessage(null), 2500);
  }

  function handleAdd(product: Product) {
    if (product.stock <= 0) {
      flash(product.id, "Out of stock — max reached");
      return;
    }
    const result = addItem(product);
    if (!result.ok) {
      flash(
        product.id,
        result.reason === "max_reached"
          ? `Max stock reached (${product.stock} available)`
          : "Out of stock"
      );
      return;
    }
    flash(
      product.id,
      result.atMax ? `Added — cart is at max (${product.stock})` : "Added to cart"
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">
          HAMA ENTERPRISE NG · Catalog
        </p>
        <h1 className="text-3xl font-bold text-[var(--heading)]">
          Store products
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {loading ? "Loading…" : `${filtered.length} products`}
          {qParam ? ` matching “${qParam}”` : ""} · Showing {" "}
          <span className="text-cyan-400">{currency}</span>
          {" "}(toggle ₦ / $ in the header)
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

      {loading ? (
        <p className="text-[var(--muted)]">Loading products…</p>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">
          No products yet. Admin can add real products (price in NGN) in the admin panel.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const inCart = getQtyInCart(p.id);
            const atMax = p.stock > 0 && inCart >= p.stock;
            const soldOut = p.stock <= 0;
            const img = productImage(p);

            return (
              <div key={p.id} className="card group overflow-hidden">
                <Link href={`/product/${p.slug}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface)]">
                    <SafeImage
                      src={img}
                      alt={p.name}
                      fill
                      useFill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 badge badge-cyan text-[10px]">
                      {p.category.toUpperCase()}
                    </span>
                    {soldOut && (
                      <span className="absolute right-3 top-3 badge badge-danger text-[10px]">
                        SOLD OUT
                      </span>
                    )}
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
                    <p className="mb-2 text-xs font-medium text-cyan-400">
                      {message.text}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold text-[var(--heading)]">
                        {format(p.price)}
                      </p>
                      <p className="text-[10px] text-[var(--muted)]">
                        {formatBoth(p.price).split("(")[1]?.replace(")", "")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAdd(p)}
                      disabled={soldOut || atMax}
                      className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {soldOut ? "Max reached" : atMax ? "Max in cart" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-[var(--muted)]">Loading catalog…</div>
      }
    >
      <CatalogInner />
    </Suspense>
  );
}
