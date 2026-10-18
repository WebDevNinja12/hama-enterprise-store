"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Zap, Shield, Truck } from "lucide-react";
import Logo from "@/components/Logo";
import SafeImage from "@/components/SafeImage";
import { productImage } from "@/lib/products";

type HomeProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  brand: string;
  image?: string;
  imageUrl?: string;
};

export default function HomePage() {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts((data.products || []).slice(0, 6)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ].slice(0, 4);

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-400">
              HAMA ENTERPRISE NG · RC 8827959
            </div>

            <div className="mb-4">
              <Logo showText />
            </div>

            <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-[var(--heading)] sm:text-5xl lg:text-6xl">
              Quality supplies from{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                HAMA ENTERPRISE NG
              </span>
            </h1>

            <p className="mb-8 max-w-md text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              Official online store. Browse real inventory added by our team —
              tools, materials, and enterprise supplies.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-sm"
              >
                Browse catalog <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://hama-enterprise-ng.vercel.app/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-2 px-7 py-3.5 text-sm"
              >
                Company website
              </a>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="card relative w-full max-w-md overflow-hidden p-6">
              <p className="text-sm font-semibold text-[var(--heading)]">
                Shop with confidence
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Secure checkout · Account required · Orders managed by HAMA admin
              </p>
              <Link
                href="/catalog"
                className="btn-primary mt-6 inline-flex px-5 py-2.5 text-sm"
              >
                View products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Truck, title: "Delivery options", desc: "Arranged after order confirmation" },
            { icon: Shield, title: "Secure checkout", desc: "Encrypted payments & accounts" },
            { icon: Zap, title: "Real inventory", desc: "Only products added by admin" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--heading)]">{item.title}</p>
                <p className="text-xs text-[var(--muted)]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label mb-2">Categories</p>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--heading)]">
                From our catalog
              </h2>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c}
                href={`/catalog?q=${encodeURIComponent(c)}`}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--heading)] hover:border-cyan-500/50 hover:text-cyan-400"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="section-label mb-2">Catalog</p>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--heading)]">
            Latest products
          </h2>
        </div>

        {loading ? (
          <p className="text-[var(--muted)]">Loading products…</p>
        ) : products.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-[var(--heading)] font-semibold">No products yet</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Products appear here when the admin adds them with real photos.
            </p>
            <Link href="/catalog" className="btn-primary mt-6 inline-flex px-6 py-2.5 text-sm">
              Open catalog
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const img = productImage(product);
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="card group overflow-hidden"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface)]">
                    <SafeImage
                      src={img}
                      alt={product.name}
                      fill
                      useFill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                      {product.brand} · {product.category}
                    </p>
                    <h3 className="mt-1 mb-4 text-lg font-semibold text-[var(--heading)] group-hover:text-cyan-400">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-cyan-400">
                        ${Number(product.price).toLocaleString()}
                      </p>
                      <span className="btn-primary px-4 py-2 text-xs">View</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
