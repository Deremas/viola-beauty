"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { consumeRateLimit, securitySettings } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/security";
import { isDbError } from "@/lib/db-errors";
import { isNextRedirect } from "@/lib/form-feedback";

export async function login(formData: FormData) {
  const requestHeaders = await headers();
  const username = String(formData.get("username") || "").trim().toLowerCase();
  try {
    const settings = await securitySettings();
    await Promise.all([
      consumeRateLimit({ action: "staff-login-ip", identifier: getRequestIp(requestHeaders), limit: settings.loginMax, windowSeconds: settings.loginWindowSeconds }),
      consumeRateLimit({ action: "staff-login-user", identifier: username || "empty", limit: settings.loginMax, windowSeconds: settings.loginWindowSeconds }),
    ]);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof RateLimitError) {
      redirect(`/login?error=rate&retryAfter=${error.retryAfter}`);
    }
    if (isDbError(error)) redirect("/login?error=unavailable");
    throw error;
  }

  try {
    await signIn("credentials", {
      username,
      password: formData.get("password"),
      redirectTo: "/admin/dashboard",
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AuthError) redirect("/login?error=credentials");
    if (isDbError(error)) redirect("/login?error=unavailable");
    throw error;
  }
}
