/** Shared checks for a database that cannot be reached. Safe to import from server code. */
export function isDbErrorMessage(message: string) {
  return /connect|connection|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|P10\d{2}|P20\d{2}|timeout|Connection closed|password authentication|database server|Database timeout|Can't reach database|Server has closed the connection|ECONNRESET/i.test(
    message,
  );
}

export function isDbError(error: unknown) {
  if (!error) return false;
  if (typeof error === "string") return isDbErrorMessage(error);
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return isDbErrorMessage(message);
}
