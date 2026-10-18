import { NextResponse } from "next/server";

/** Lightweight health check — no DB, no loops */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "hama-enterprise-store",
      ts: Date.now(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
