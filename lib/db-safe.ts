import { isDbError } from "@/lib/db-errors";

const DB_OP_TIMEOUT_MS = 8_000;
export const PUBLIC_DB_TIMEOUT_MS = 8_000;

export async function withDb<T>(label: string, fn: () => Promise<T>, fallback: T, timeoutMs = DB_OP_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Database timeout (${label})`)), timeoutMs);
      }),
    ]);
  } catch (error) {
    if (isDbError(error)) console.warn(`[records] ${label} unavailable`);
    else console.error(`[records] ${label}`, error);
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function withPublicDb<T>(label: string, fn: () => Promise<T>, fallback: T) {
  return withDb(label, fn, fallback, PUBLIC_DB_TIMEOUT_MS);
}

export async function tryPublicDb<T>(label: string, fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const data = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Database timeout (${label})`)), PUBLIC_DB_TIMEOUT_MS);
      }),
    ]);
    return { ok: true, data };
  } catch (error) {
    if (isDbError(error)) console.warn(`[records] ${label} unavailable`);
    else console.error(`[records] ${label}`, error);
    return { ok: false };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
