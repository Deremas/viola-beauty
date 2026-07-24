import { prisma } from "@/lib/prisma";
import { securityHash } from "@/lib/security";

export class RateLimitError extends Error {
  readonly retryAfter: number;

  constructor(retryAfter: number) {
    super(`Too many requests. Try again in ${retryAfter} seconds.`);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export async function consumeRateLimit(input: {
  action: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}) {
  const now = new Date();
  const windowMs = input.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs);
  const keyHash = securityHash(`${input.action}:${input.identifier}`);

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { action_keyHash_windowStart: { action: input.action, keyHash, windowStart } },
    update: { count: { increment: 1 }, expiresAt },
    create: { action: input.action, keyHash, windowStart, expiresAt, count: 1 },
    select: { count: true },
  });

  if (bucket.count === 1) {
    void prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined);
  }

  const retryAfter = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000));
  if (bucket.count > input.limit) throw new RateLimitError(retryAfter);
  return { remaining: Math.max(0, input.limit - bucket.count), retryAfter };
}

export async function securitySettings() {
  return prisma.securitySetting.upsert({
    where: { id: "primary" },
    update: {},
    create: { id: "primary" },
  });
}
