import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { products as seedProducts } from "@/lib/products";
import { cacheGet, cacheSet, rateLimitIncr } from "@/lib/redis";

const MAX_Q = 64;
const MAX_RESULTS = 8;

const POPULAR = [
  "headset",
  "earbuds",
  "wearables",
  "neural",
  "optics",
  "quantum",
  "ring",
  "hama",
];

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

function editDist(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const m = a.length;
  const n = Math.min(b.length, a.length + 2);
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

function scoreSeed(q: string) {
  const ql = q.toLowerCase();
  const out: {
    type: "product" | "category";
    id: string;
    name: string;
    slug?: string;
    category?: string;
    price?: number;
    image?: string;
    rank: number;
  }[] = [];

  const cats = new Set<string>();
  for (const p of seedProducts) {
    const name = p.name.toLowerCase();
    const cat = p.category.toLowerCase();
    const brand = p.brand.toLowerCase();
    let rank = 0;
    if (name.includes(ql) || cat.includes(ql) || brand.includes(ql)) rank = 3;
    else if (name.split(/\s+/).some((w) => editDist(w, ql) <= 1)) rank = 2;
    else if (editDist(name.slice(0, ql.length + 2), ql) <= 2) rank = 1;
    if (rank > 0) {
      out.push({
        type: "product",
        id: `seed-${p.id}`,
        name: p.name,
        slug: p.slug,
        category: p.category,
        price: p.price,
        image: p.image,
        rank,
      });
    }
    if (cat.includes(ql) || editDist(cat, ql) <= 1) cats.add(p.category);
  }
  for (const c of cats) {
    out.push({ type: "category", id: `cat-${c}`, name: c, rank: 2.5 });
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = await rateLimitIncr(`search:${ip}`, 40, 60);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many searches", code: 429, results: [] },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const raw = req.nextUrl.searchParams.get("q") || "";
    const q = raw.trim().slice(0, MAX_Q);
    if (q.length < 2) {
      return NextResponse.json({ results: [], popular: POPULAR.slice(0, 6) });
    }

    const cacheKey = `search:q:${q.toLowerCase()}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: { "X-Cache": "HIT", "Cache-Control": "private, max-age=30" },
      });
    }

    let results = scoreSeed(q);

    try {
      const pattern = `%${q.replace(/[%_]/g, "")}%`;
      type Row = {
        id: string;
        name: string;
        slug: string;
        category: string;
        price: unknown;
        imageUrl: string | null;
        rank: number;
      };

      const rows = await prisma.$queryRawUnsafe<Row[]>(
        `
        SELECT id, name, slug, category, price, "imageUrl",
          ts_rank(
            to_tsvector('english', coalesce(name,'') || ' ' || coalesce(category,'') || ' ' || coalesce(brand,'')),
            plainto_tsquery('english', $1)
          ) AS rank
        FROM "StoreProduct"
        WHERE published = true
          AND (
            to_tsvector('english', coalesce(name,'') || ' ' || coalesce(category,'') || ' ' || coalesce(brand,''))
              @@ plainto_tsquery('english', $1)
            OR name ILIKE $2
            OR category ILIKE $2
            OR brand ILIKE $2
          )
        ORDER BY rank DESC, name ASC
        LIMIT $3
        `,
        q,
        pattern,
        MAX_RESULTS
      );

      for (const r of rows) {
        results.push({
          type: "product",
          id: r.id,
          name: r.name,
          slug: r.slug,
          category: r.category,
          price: Number(r.price),
          image: r.imageUrl || undefined,
          rank: Number(r.rank) + 3,
        });
      }
    } catch {
      /* seed-only */
    }

    const popularHits = POPULAR.filter((p) => p.includes(q.toLowerCase())).map(
      (p) => ({
        type: "popular" as const,
        id: `pop-${p}`,
        name: p,
        rank: 1.5,
      })
    );
    results = [...results, ...popularHits];

    const seen = new Set<string>();
    results = results
      .sort((a, b) => b.rank - a.rank)
      .filter((r) => {
        const k = `${r.type}:${r.name.toLowerCase()}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, MAX_RESULTS)
      .map(({ rank: _r, ...rest }) => rest);

    const body = { results, q };
    await cacheSet(cacheKey, JSON.stringify(body), 60);

    return NextResponse.json(body, {
      headers: { "X-Cache": "MISS", "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
