import { PrismaClient } from "@prisma/client";

function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol.startsWith("postgres")) {
      if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "4");
      if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "4");
      if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const url = databaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  (url ? new PrismaClient({ datasources: { db: { url } } }) : new PrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
