import { NextResponse } from "next/server";
import { execSync } from "child_process";

/**
 * One-time schema push against the resolved DB URL.
 * Protected by ADMIN_BOOTSTRAP_SECRET header when set.
 */
export async function POST(req: Request) {
  try {
    const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (secret) {
      const hdr = req.headers.get("x-bootstrap-secret");
      if (hdr !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const url =
      process.env.hamadatabase_DATABASE_URL ||
      process.env.hamadatabase_POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL;

    if (!url) {
      return NextResponse.json(
        { error: "No database URL found in environment" },
        { status: 500 }
      );
    }

    // prisma db push using the resolved URL
    const out = execSync("npx prisma db push --skip-generate --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: url },
      encoding: "utf8",
      timeout: 60_000,
    });

    return NextResponse.json({
      ok: true,
      message: "Schema pushed",
      log: out.slice(0, 2000),
    });
  } catch (err) {
    console.error("db-setup error:", err);
    return NextResponse.json(
      {
        error: "Schema push failed",
        detail: String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/db-setup",
    note: "Creates Prisma tables on the connected database",
  });
}
