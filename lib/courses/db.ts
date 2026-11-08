import { Prisma } from "@prisma/client";

export function isMissingRelation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022");
}

function isDatabaseUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false;
  const candidate = error as Error & { code?: string; errorCode?: string };
  return ["P1001", "P1002", "P1017", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EHOSTUNREACH"].includes(candidate.errorCode || candidate.code || "")
    || /can't reach database server|timed out fetching a new connection|connection terminated unexpectedly/i.test(error.message);
}

export async function readIfReady<T>(query: () => Promise<T>, fallback: T) {
  try {
    return await query();
  } catch (error) {
    if (isMissingRelation(error) || isDatabaseUnavailable(error)) return fallback;
    throw error;
  }
}
