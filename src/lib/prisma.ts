import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prefer a pooled connection string in production:
 * - DATABASE_URL = pooled (Prisma Accelerate / PgBouncer / Neon pooler)
 * - DIRECT_URL   = direct (migrations only)
 * Keep queries short so serverless functions stay under timeout.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
