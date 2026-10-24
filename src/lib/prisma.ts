import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Resolve DB URL from standard or Vercel Storage-prefixed names. */
function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PRISMA_DATABASE_URL ||
    process.env.hamadatabase_DATABASE_URL ||
    process.env.hamadatabase_POSTGRES_URL ||
    process.env.hamadatabase_PRISMA_DATABASE_URL ||
    process.env.hamastoredatabase_DATABASE_URL ||
    process.env.hamastoredatabase_POSTGRES_URL ||
    process.env.hamasave_DATABASE_URL ||
    process.env.hamasave_POSTGRES_URL
  );
}

const datasourceUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
