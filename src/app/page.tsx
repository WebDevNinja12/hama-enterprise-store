import Link from "next/link";
import { ArrowRight, Zap, Star } from "lucide-react";

const categories = [
  { id: "1", name: "Immersive Audio", slug: "audio", description: "Spatial acoustics with neural noise cancelation.", tag: "01 / SOUND" },
  { id: "2", name: "Smart Wearables", slug: "wearables", description: "Biometric tracking paired with quantum sensors.", tag: "02 / BODY" },
  { id: "3", name: "Smart Home", slug: "smart-home", description: "Autonomous ambient control & security nodes.", tag: "03 / HABITAT" },
  { id: "4", name: "Next-Gen Gaming", slug: "gaming", description: "Haptic feedback gear with sub-millisecond response.", tag: "04 / PLAY" },
];

const featured = [
  { id: "1", name: "AuraBuds Pro Neural", price: 299, tag: "BESTSELLER", category: "Audio" },
  { id: "2", name: "Nexus Ring Gen-3", price: 349, tag: "NEW RELEASE", category: "Wearables" },
  { id: "3", name: "HoloBeam Nano", price: 599, tag: "LIMITED", category: "Optics" },
];

export default function HomePage() {
  return (
    <div className="pb-16">
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
              <Zap className="h-3.5 w-3.5" /> NEXT-GEN HARDWARE RELEASE
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Experience Reality,{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">Redefined by Hama.</span>
            </h1>
            <p className="mb-8 max-w-lg text-base leading-relaxed text-[var(--muted)]">
              Step into tomorrow with our flagship spatial computing and neural-interface hardware. Immersive visuals, zero latency, infinite workspace.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="btn-primary inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm">
                Shop the Future <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/catalog" className="btn-secondary inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm">Explore Categories</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm">
              <div><p className="text-2xl font-bold text-white">8K</p><p className="text-[var(--muted)]">Per-Eye Micro OLED</p></div>
              <div><p className="text-2xl font-bold text-white">120Hz</p><p className="text-[var(--muted)]">Refresh Rate</p></div>
              <div><p className="text-2xl font-bold text-white">18hr</p><p className="text-[var(--muted)]">Neural Battery</p></div>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="card glow-cyan relative w-full max-w-md overflow-hidden p-6">
              <div className="mb-4 flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-900/30 text-6xl">🥽</div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted)]">Nexus Vision X1</p>
                  <p className="text-xl font-bold text-white">$1,499.00 USD</p>
                </div>
                <Link href="/catalog" className="btn-primary rounded-lg px-4 py-2 text-sm">Quick View</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">Ecosystem</p>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Trending Categories</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/catalog?category=${cat.slug}`} className="card group p-5">
              <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-4xl transition group-hover:from-cyan-900/40">
                {cat.slug === "audio" && "\ud83c\udfa7"}{cat.slug === "wearables" && "\u231a"}{cat.slug === "smart-home" && "\ud83c\udfe0"}{cat.slug === "gaming" && "\ud83c\udfae"}
              </div>
              <p className="mb-1 text-xs font-medium text-cyan-400/80">{cat.tag}</p>
              <h3 className="mb-1 font-semibold text-white">{cat.name}</h3>
              <p className="mb-3 text-sm text-[var(--muted)]">{cat.description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-400">Explore <ArrowRight className="h-3.5 w-3.5" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">Catalog</p>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Featured Hardware</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <div key={product.id} className="card group overflow-hidden">
              <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-slate-800/80 to-slate-900 text-6xl">
                <span className="absolute left-3 top-3 badge badge-cyan">{product.tag}</span>
                {product.category === "Audio" && "\ud83c\udfa7"}{product.category === "Wearables" && "\ud83d\udc8d"}{product.category === "Optics" && "\ud83d\udce1"}
              </div>
              <div className="p-5">
                <p className="text-xs text-[var(--muted)]">HAMA {product.category.toUpperCase()}</p>
                <h3 className="mb-2 font-semibold text-white">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-cyan-400">${product.price.toFixed(2)}</p>
                  <button className="btn-primary rounded-lg px-4 py-2 text-xs">Quick Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">Testimonials</p>
          <h2 className="text-2xl font-bold text-white">Trusted by Tech Pioneers</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Dr. Jonathan Doe", role: "Lead AI Researcher", text: "The Vision X1 completely replaced my desktop monitors. The fidelity and spatial anchoring are lightyears ahead.", initials: "JD" },
            { name: "Elena Rostova", role: "Music Producer", text: "AuraBuds Pro fit securely and the adaptive spatial audio makes listening an entirely new experience.", initials: "ER" },
            { name: "Marcus Vance", role: "Extreme Athlete", text: "The Nexus Ring battery longevity is incredible. I only charge it once every two weeks.", initials: "MV" },
          ].map((t) => (
            <div key={t.name} className="card p-6">
              <div className="mb-3 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-cyan-400 text-cyan-400" />))}</div>
              <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">{t.initials}</div>
                <div><p className="text-sm font-semibold text-white">{t.name}</p><p className="text-xs text-[var(--muted)]">{t.role}</p></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
