import { createHash, createHmac, randomUUID } from "crypto";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is required for security hashing");
  return value;
}

export function securityHash(value: string) {
  return createHmac("sha256", secret()).update(value.trim().toLowerCase()).digest("hex");
}

export function requestFingerprint(values: Array<string | number | null | undefined>) {
  return createHash("sha256").update(values.map((value) => String(value ?? "").trim()).join("\u001f")).digest("hex");
}

export function createErrorReference() {
  return randomUUID().split("-")[0].toUpperCase();
}

export function getRequestIp(headers: Headers) {
  return (
    headers.get("cf-connecting-ip")
    || headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headers.get("x-real-ip")
    || "unknown"
  );
}
