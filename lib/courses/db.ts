import { Prisma } from "@prisma/client";

export function isMissingRelation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022");
}

function readFailureLabel(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
  if (error instanceof Prisma.PrismaClientInitializationError) return error.errorCode || error.name;
  if (error instanceof Prisma.PrismaClientRustPanicError) return error.name;
  if (error instanceof Error) return error.name;
  return "unknown";
}

export async function readIfReady<T>(query: () => Promise<T>, fallback: T) {
  try {
    return await query();
  } catch (error) {
    console.error(`Public read failed (${readFailureLabel(error)}). The page will keep its saved content.`);
    return fallback;
  }
}
