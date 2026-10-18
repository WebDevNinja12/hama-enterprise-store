import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { randomSuffix } from "@/lib/blob";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const VIDEO_TYPES = ["video/mp4"] as const;
const IMAGE_MAX = 5 * 1024 * 1024; // 5 MB
const VIDEO_MAX = 20 * 1024 * 1024; // 20 MB

/**
 * Token route for direct browser → Vercel Blob uploads.
 * Admin session required. No disk writes / Express multer.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Admin session required. Sign in again and retry." },
      { status: 403 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN is not set. In Vercel → Storage → Blob, create a store and add the token to Environment Variables (Production + Preview).",
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const lower = pathname.toLowerCase();
        const isVideo =
          lower.endsWith(".mp4") || lower.includes("video");

        return {
          allowedContentTypes: isVideo
            ? [...VIDEO_TYPES]
            : [...IMAGE_TYPES],
          maximumSizeInBytes: isVideo ? VIDEO_MAX : IMAGE_MAX,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            role: "ADMIN",
            nonce: randomSuffix(),
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.info("[blob] uploaded", blob.url);
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    console.error("Blob upload error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Upload failed. Check file type (JPEG/PNG/WebP/MP4) and size.",
      },
      { status: 400 }
    );
  }
}
