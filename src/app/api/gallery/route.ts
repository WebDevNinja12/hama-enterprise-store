import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function assertHttpsMedia(url: string, label: string) {
  const t = String(url || "").trim();
  if (!t.startsWith("https://")) {
    throw new Error(`${label} must be an https:// URL (upload via Blob)`);
  }
  if (t.startsWith("data:") || t.startsWith("blob:")) {
    throw new Error(`${label} cannot be a data/blob URL`);
  }
  return t;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const adminFlag = req.nextUrl.searchParams.get("admin") === "1";
    let isAdmin = false;
    if (adminFlag) {
      const session = await auth();
      isAdmin = session?.user?.role === "ADMIN";
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    const items = await prisma.galleryMedia.findMany({
      where: isAdmin ? undefined : { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ items }, { headers: corsHeaders });
  } catch (error) {
    console.error("Gallery GET error:", error);
    return NextResponse.json(
      { items: [], error: "Failed to load gallery" },
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
    const { title, type, url, poster, narration, published, sortOrder } = body;

    if (!title || !type || !url) {
      return NextResponse.json(
        { error: "title, type, and url are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (type !== "IMAGE" && type !== "VIDEO") {
      return NextResponse.json(
        { error: "type must be IMAGE or VIDEO" },
        { status: 400, headers: corsHeaders }
      );
    }

    let safeUrl: string;
    try {
      safeUrl = assertHttpsMedia(url, "url");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid url" },
        { status: 400, headers: corsHeaders }
      );
    }

    let safePoster: string | null = null;
    if (poster) {
      try {
        safePoster = assertHttpsMedia(poster, "poster");
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Invalid poster" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const item = await prisma.galleryMedia.create({
      data: {
        title: String(title).trim(),
        type,
        url: safeUrl,
        poster: safePoster,
        narration: narration ? String(narration).trim() : null,
        published: published !== false,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      },
    });

    return NextResponse.json({ item }, { headers: corsHeaders });
  } catch (error) {
    console.error("Gallery POST error:", error);
    return NextResponse.json(
      { error: "Failed to save gallery item" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403, headers: corsHeaders }
      );
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await prisma.galleryMedia.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Gallery DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500, headers: corsHeaders }
    );
  }
}
