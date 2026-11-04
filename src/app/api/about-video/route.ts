import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const KEY = "about-promo";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function assertHttps(url: string, label: string) {
  const t = String(url || "").trim();
  if (!t.startsWith("https://")) {
    throw new Error(`${label} must be https:// (use Blob upload)`);
  }
  if (t.startsWith("data:") || t.startsWith("blob:")) {
    throw new Error(`${label} cannot be a data/blob URL`);
  }
  return t;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const item = await prisma.siteMedia.findUnique({ where: { key: KEY } });
    if (!item || !item.published) {
      return NextResponse.json(
        { url: null, poster: null },
        { headers: corsHeaders }
      );
    }
    return NextResponse.json(
      {
        url: item.url,
        poster: item.poster,
        title: item.title,
        published: item.published,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("About video GET error:", error);
    return NextResponse.json(
      { url: null, poster: null, error: "Failed to load" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { title, url, poster, published } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    let safeUrl: string;
    try {
      safeUrl = assertHttps(url, "url");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid url" },
        { status: 400, headers: corsHeaders }
      );
    }

    let safePoster: string | null = null;
    if (poster) {
      try {
        safePoster = assertHttps(String(poster), "poster");
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Invalid poster" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const item = await prisma.siteMedia.upsert({
      where: { key: KEY },
      create: {
        key: KEY,
        title: title ? String(title).trim() : "About promo",
        url: safeUrl,
        poster: safePoster,
        published: published !== false,
      },
      update: {
        title: title ? String(title).trim() : undefined,
        url: safeUrl,
        poster: safePoster,
        published: published !== false,
      },
    });

    return NextResponse.json({ item }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("About video POST error:", error);
    return NextResponse.json(
      { error: "Failed to save about video" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403, headers: corsHeaders }
      );
    }

    await prisma.siteMedia.deleteMany({ where: { key: KEY } });
    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("About video DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove about video" },
      { status: 500, headers: corsHeaders }
    );
  }
}
