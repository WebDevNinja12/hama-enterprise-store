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
      return NextResponse.json({ results: [], popular: [] });
    }

    const cacheKey = `search:q:${q.toLowerCase()}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: { "X-Cache": "HIT", "Cache-Control": "private, max-age=30" },
      });
    }

    type Row = {
      id: string;
      name: string;
      slug: string;
      category: string;
      price: unknown;
      imageUrl: string | null;
      rank: number;
    };

    const pattern = `%${q.replace(/[%_]/g, "")}%`;
    let rows: Row[] = [];

    try {
      rows = await prisma.$queryRawUnsafe<Row[]>(
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
    } catch {
      rows = await prisma.$queryRawUnsafe<Row[]>(
        `
        SELECT id, name, slug, category, price, "imageUrl", 1::float AS rank
        FROM "StoreProduct"
        WHERE published = true
          AND (name ILIKE $1 OR category ILIKE $1 OR brand ILIKE $1)
        ORDER BY name ASC
        LIMIT $2
        `,
        pattern,
        MAX_RESULTS
      );
    }

    const results = rows.map((r) => ({
      type: "product" as const,
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category,
      price: Number(r.price),
      image: r.imageUrl || undefined,
    }));

    // Categories from matches
    const cats = [...new Set(rows.map((r) => r.category))].slice(0, 3).map((c) => ({
      type: "category" as const,
      id: `cat-${c}`,
      name: c,
    }));

    const body = { results: [...results, ...cats].slice(0, MAX_RESULTS), q };
    await cacheSet(cacheKey, JSON.stringify(body), 60);

    return NextResponse.json(body, {
      headers: { "X-Cache": "MISS", "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
