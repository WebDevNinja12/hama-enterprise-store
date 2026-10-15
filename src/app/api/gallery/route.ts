import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/** Public: list published gallery media for the main website Gallery page */
export async function GET() {
  try {
    const items = await prisma.galleryMedia.findMany({
      where: { published: true },
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

/** Admin: create a gallery item (image or video URL) */
export async function POST(req: NextRequest) {
  try {
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

    const item = await prisma.galleryMedia.create({
      data: {
        title,
        type,
        url,
        poster: poster || null,
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

/** Admin: delete a gallery item by id */
export async function DELETE(req: NextRequest) {
  try {
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
