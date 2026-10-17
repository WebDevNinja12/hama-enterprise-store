import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/** Public: published only. Admin: ?admin=1 all items */
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
    const { title, type, url, poster, published, sortOrder } = body;

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

    // Guard oversized data URLs
    if (typeof url === "string" && url.startsWith("data:") && url.length > 3_500_000) {
      return NextResponse.json(
        { error: "File too large. Use a smaller file or external URL." },
        { status: 400, headers: corsHeaders }
      );
    }

    const item = await prisma.galleryMedia.create({
      data: {
        title: String(title).trim(),
        type,
        url: String(url),
        poster: poster ? String(poster) : null,
        published: published !== false,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      },
    });

    return NextResponse.json({ item }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Gallery POST error:", error);
    return NextResponse.json(
      { error: "Failed to create gallery item" },
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await prisma.galleryMedia.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Gallery DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery item" },
      { status: 500, headers: corsHeaders }
    );
  }
}
