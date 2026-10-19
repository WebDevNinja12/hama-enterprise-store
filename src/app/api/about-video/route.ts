import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const KEY = "about-promo";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const item = await prisma.siteMedia.findUnique({ where: { key: KEY } });
    if (!item || !item.published) {
      return NextResponse.json({ url: null, poster: null }, { headers: corsHeaders });
    }
    return NextResponse.json(
      { url: item.url, poster: item.poster, title: item.title },
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

    if (url.startsWith("data:") && url.length > 3_500_000) {
      return NextResponse.json(
        { error: "File too large. Use a smaller file or external URL." },
        { status: 400, headers: corsHeaders }
      );
    }

    const item = await prisma.siteMedia.upsert({
      where: { key: KEY },
      create: {
        key: KEY,
        title: title ? String(title).trim() : "About promo",
        url: String(url),
        poster: poster ? String(poster) : null,
        published: published !== false,
      },
      update: {
        title: title ? String(title).trim() : undefined,
        url: String(url),
        poster: poster ? String(poster) : null,
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
