import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Client-side direct upload to Vercel Blob (bypasses 4.5MB serverless body limit).
 * Requires BLOB_READ_WRITE_TOKEN in Vercel env.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN not configured. Add a Vercel Blob store and token.",
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/avif",
          "image/gif",
        ],
        maximumSizeInBytes: 8 * 1024 * 1024,
        tokenPayload: JSON.stringify({ userId: session.user.id }),
      }),
      onUploadCompleted: async () => {
        /* URL stored by client via product PATCH */
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    console.error("Blob upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 }
    );
  }
}
