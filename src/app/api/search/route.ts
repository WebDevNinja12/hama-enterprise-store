import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, rateLimitIncr } from "@/lib/redis";

const MAX_Q = 64;
const MAX_RESULTS = 8;

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

/** Escape % and _ for SQL LIKE when using fallback raw queries */
function sanitizeTerm(s: string) {
  return s.replace(/[%_\\]/g, "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = await rateLimitIncr(`search:${ip}`, 60, 60);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many searches", results: [] },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const raw = req.nextUrl.searchParams.get("q") || "";
    const q = raw.trim().slice(0, MAX_Q);
    if (q.length < 2) {
      return NextResponse.json({ results: [], popular: [] });
    }

    const cacheKey = `search:q:v2:${q.toLowerCase()}`;
    try {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached), {
          headers: { "X-Cache": "HIT", "Cache-Control": "private, max-age=30" },
        });
      }
    } catch {
      /* cache optional */
    }

    const terms = q
      .toLowerCase()
      .split(/\s+/)
      .map(sanitizeTerm)
      .filter((t) => t.length >= 1)
      .slice(0, 5);

    if (terms.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Match if ANY term appears in name, category, brand, or description
    // (partial words work: "ham" matches "hammer")
    const orFilters = terms.flatMap((term) => [
      { name: { contains: term, mode: "insensitive" as const } },
      { category: { contains: term, mode: "insensitive" as const } },
      { brand: { contains: term, mode: "insensitive" as const } },
      { description: { contains: term, mode: "insensitive" as const } },
    ]);

    let products: {
      id: string;
      name: string;
      slug: string;
      category: string;
      brand: string;
      price: unknown;
      imageUrl: string | null;
    }[] = [];

    try {
      products = await prisma.storeProduct.findMany({
        where: {
          published: true,
          OR: orFilters,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          brand: true,
          price: true,
          imageUrl: true,
        },
        orderBy: { name: "asc" },
        take: 40,
      });
    } catch (e) {
      console.error("[search] prisma findMany failed, trying raw ILIKE:", e);
      // Fallback if mode insensitive unsupported or client out of date
      const pattern = `%${sanitizeTerm(q)}%`;
      try {
        products = await prisma.$queryRawUnsafe(
          `SELECT id, name, slug, category, brand, price, "imageUrl"
           FROM "StoreProduct"
           WHERE published = true
             AND (
               name ILIKE $1 OR category ILIKE $1 OR brand ILIKE $1
               OR description ILIKE $1
             )
           ORDER BY name ASC
           LIMIT 40`,
          pattern
        );
      } catch (e2) {
        console.error("[search] raw fallback failed:", e2);
        products = [];
      }
    }

    // Rank: prefer name matches, then category/brand
    const qLower = q.toLowerCase();
    const ranked = [...products].sort((a, b) => {
      const score = (p: (typeof products)[0]) => {
        const n = p.name.toLowerCase();
        const c = (p.category || "").toLowerCase();
        const br = (p.brand || "").toLowerCase();
        let s = 0;
        if (n === qLower) s += 100;
        if (n.startsWith(qLower)) s += 50;
        if (n.includes(qLower)) s += 30;
        for (const t of terms) {
          if (n.includes(t)) s += 10;
          if (c.includes(t)) s += 5;
          if (br.includes(t)) s += 4;
        }
        return s;
      };
      return score(b) - score(a);
    });

    const top = ranked.slice(0, MAX_RESULTS);

    const results = top.map((r) => ({
      type: "product" as const,
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category,
      brand: r.brand,
      price: Number(r.price),
      image: r.imageUrl || undefined,
    }));

    const cats = [...new Set(top.map((r) => r.category).filter(Boolean))]
      .slice(0, 3)
      .map((c) => ({
        type: "category" as const,
        id: `cat-${c}`,
        name: c,
      }));

    const body = {
      results: [...results, ...cats].slice(0, MAX_RESULTS),
      q,
      count: results.length,
    };

    try {
      await cacheSet(cacheKey, JSON.stringify(body), 45);
    } catch {
      /* ignore */
    }

    return NextResponse.json(body, {
      headers: { "X-Cache": "MISS", "Cache-Control": "private, max-age=20" },
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { results: [], error: "Search failed" },
      { status: 500 }
    );
  }
}
