import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isDbError } from "@/lib/db-errors";
import { ZodError } from "zod";
import { fieldForMessage } from "@/lib/form-fields";

export function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest || "").startsWith("NEXT_REDIRECT")
  );
}

/** Send the person back to the form with a field message. Never exposes a database error. */
export async function failForm(message: string, field?: string): Promise<never> {
  const safe = isDbError(message)
    ? "The studio records could not be reached. Nothing was saved."
    : message.slice(0, 280);
  const headerStore = await headers();
  const referer = headerStore.get("referer");
  let path = "/admin";
  const params = new URLSearchParams();
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.pathname.startsWith("/")) path = url.pathname;
    } catch {
      path = "/admin";
    }
  }
  params.set("formError", safe);
  const resolved = field || fieldForMessage(safe);
  if (resolved) params.set("field", resolved);
  redirect(`${path}?${params.toString()}`);
}

export async function parseForm<T>(schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: ZodError } }, input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0] ? String(issue.path[0]) : undefined;
    return failForm(issue?.message || "Check this field and try again", field);
  }
  return parsed.data;
}
