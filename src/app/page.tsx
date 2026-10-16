import Link from "next/link";
import { ArrowRight, Zap, Star, Shield, Truck, Sparkles } from "lucide-react";

const categories = [
  {
    id: "1",
    name: "Immersive Audio",
    slug: "audio",
    description: "Spatial acoustics with neural noise cancelation.",
    tag: "01 · SOUND",
    emoji: "🎧",
  },
  {
    id: "2",
    name: "Smart Wearables",
    slug: "wearables",
    description: "Biometric tracking with quantum sensors.",
    tag: "02 · BODY",
    emoji: "⌚",
  },
  {
    id: "3",
    name: "Smart Home",
    slug: "smart-home",
    description: "Ambient control and security nodes.",
    tag: "03 · HABITAT",
    emoji: "🏠",
  },
  {
    id: "4",
    name: "Next-Gen Gaming",
    slug: "gaming",
    description: "Haptic gear with sub-ms response.",
    tag: "04 · PLAY",
    emoji: "🎮",
  },
];

const featured = [
  { id: "1", name: "AuraBuds Pro Neural", price: 299, tag: "BESTSELLER", category: "Audio", emoji: "🎧" },
  { id: "2", name: "Nexus Ring Gen-3", price: 349, tag: "NEW", category: "Wearables", emoji: "💍" },
  { id: "3", name: "HoloBeam Nano", price: 599, tag: "LIMITED", category: "Optics", emoji: "📡" },
];

export default function HomePage() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" />
              Next-gen hardware · 2026
            </div>

            <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-[var(--heading)] sm:text-5xl lg:text-6xl">
              Experience reality,{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                redefined by Hama.
              </span>
            </h1>

            <p className="mb-8 max-w-md text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              Flagship spatial computing and neural-interface hardware.
              Immersive visuals, zero latency, infinite workspace.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-sm"
              >
                Shop the future <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/catalog"
                className="btn-secondary inline-flex items-center gap-2 px-7 py-3.5 text-sm"
              >
                Browse catalog
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-8 border-t border-[var(--border)] pt-8">
              {[
                { v: "8K", l: "Per-eye micro OLED" },
                { v: "120Hz", l: "Refresh rate" },
                { v: "18hr", l: "Neural battery" },
              ].map((s) => (
                <div key={s.v}>
                  <p className="text-2xl font-bold tracking-tight text-[var(--heading)]">{s.v}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="card glow-cyan relative w-full max-w-md overflow-hidden p-2">
              <div className="flex aspect-[4/3] items-center justify-center rounded-[16px] bg-gradient-to-br from-cyan-500/15 via-slate-800/40 to-blue-900/30 text-7xl">
                🥽
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    Nexus Vision X1
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[var(--heading)]">$1,499</p>
                </div>
                <Link href="/catalog" className="btn-primary px-5 py-2.5 text-sm">
                  View
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Truck, title: "Free shipping", desc: "On orders over $500" },
            { icon: Shield, title: "Secure checkout", desc: "Encrypted payments" },
            { icon: Zap, title: "Fast fulfillment", desc: "Ships within 48 hours" },
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

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label mb-2">Ecosystem</p>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--heading)]">
              Trending categories
            </h2>
          </div>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/catalog`} className="card group p-5">
              <div className="mb-5 flex aspect-[5/3] items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-[var(--surface)] text-4xl transition group-hover:from-cyan-500/20">
                {cat.emoji}
              </div>
              <p className="mb-1 text-[10px] font-bold tracking-widest text-cyan-400/90">
                {cat.tag}
              </p>
              <h3 className="mb-1.5 text-base font-semibold text-[var(--heading)]">
                {cat.name}
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
                {cat.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-400">
                Explore <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="section-label mb-2">Catalog</p>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--heading)]">
            Featured hardware
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <Link key={product.id} href="/catalog" className="card group overflow-hidden">
              <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-cyan-500/5 to-[var(--surface)] text-6xl">
                <span className="absolute left-4 top-4 badge badge-cyan">{product.tag}</span>
                {product.emoji}
              </div>
              <div className="p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  HAMA · {product.category}
                </p>
                <h3 className="mt-1 mb-4 text-lg font-semibold text-[var(--heading)] group-hover:text-cyan-400">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-cyan-400">
                    ${product.price.toFixed(0)}
                  </p>
                  <span className="btn-primary px-4 py-2 text-xs">Shop</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="section-label mb-2">Testimonials</p>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--heading)]">
            Trusted by tech pioneers
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              name: "Dr. Jonathan Doe",
              role: "Lead AI Researcher",
              text: "The Vision X1 replaced my desktop monitors. Fidelity and spatial anchoring are lightyears ahead.",
              initials: "JD",
            },
            {
              name: "Elena Rostova",
              role: "Music Producer",
              text: "AuraBuds Pro fit securely and adaptive spatial audio makes listening a new experience.",
              initials: "ER",
            },
            {
              name: "Marcus Vance",
              role: "Extreme Athlete",
              text: "Nexus Ring battery life is incredible — I only charge it once every two weeks.",
              initials: "MV",
            },
          ].map((t) => (
            <div key={t.name} className="card p-7">
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-cyan-400 text-cyan-400" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-[var(--muted)]">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 border-t border-[var(--border)] pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/20 text-xs font-bold text-cyan-400">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--heading)]">{t.name}</p>
                  <p className="text-xs text-[var(--muted)]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="card relative overflow-hidden px-8 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10" />
          <div className="relative">
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">
              Ready to upgrade your setup?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-sm text-[var(--muted)]">
              Explore the full HAMA ENTERPRISE NG catalog of next-generation hardware.
            </p>
            <Link
              href="/catalog"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm"
            >
              Browse catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
