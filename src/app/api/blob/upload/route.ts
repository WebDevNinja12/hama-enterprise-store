import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBlobToken, randomSuffix } from "@/lib/blob";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const VIDEO_TYPES = ["video/mp4"] as const;
const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 20 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Admin session required. Sign in again and retry." },
      { status: 403 }
    );
  }

  const token = getBlobToken();
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Blob token missing. Set BLOB_READ_WRITE_TOKEN (or BLOB_HOUSE_READ_WRITE_TOKEN) in Vercel env and redeploy.",
      },
      { status: 503 }
    );
  }

  // Ensure SDK sees the standard env name
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    process.env.BLOB_READ_WRITE_TOKEN = token;
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const lower = pathname.toLowerCase();
        const isVideo = lower.endsWith(".mp4") || lower.includes("video");
        return {
          allowedContentTypes: isVideo ? [...VIDEO_TYPES] : [...IMAGE_TYPES],
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
