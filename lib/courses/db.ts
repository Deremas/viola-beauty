import { Prisma } from "@prisma/client";
import { withPublicDb } from "@/lib/db-safe";

export function isMissingRelation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022");
}

export function readIfReady<T>(query: () => Promise<T>, fallback: T) {
  return withPublicDb("public-read", query, fallback);
}
