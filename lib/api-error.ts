import { createErrorReference } from "@/lib/security";
import { RateLimitError } from "@/lib/rate-limit";
import { isDbError } from "@/lib/db-errors";

export function apiError(error: unknown, fallback = "The request could not be completed.") {
  if (isDbError(error)) {
    console.warn("[api] studio records unavailable");
    return Response.json(
      { error: "The studio records are temporarily unavailable. Please try again.", code: "DB_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (error instanceof RateLimitError) {
    return Response.json(
      { error: "Too many requests. Please wait before trying again.", code: "RATE_LIMITED", retryAfter: error.retryAfter },
      { status: 429, headers: { "Retry-After": String(error.retryAfter), "Cache-Control": "no-store" } },
    );
  }

  const reference = createErrorReference();
  console.error(`[${reference}]`, error);
  return Response.json(
    { error: fallback, code: "REQUEST_FAILED", reference },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}
