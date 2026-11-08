"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { consumeRateLimit, securitySettings } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/security";
import { createCourseRegistration, RegistrationError } from "@/lib/courses/create-registration";

export async function registerForCourse(_previous: { error: string }, formData: FormData): Promise<{ error: string }> {
  if (String(formData.get("website") || "").trim()) return { error: "The registration could not be sent." };
  const requestHeaders = await headers();
  try {
    const settings = await securitySettings();
    await consumeRateLimit({
      action: "course-registration",
      identifier: getRequestIp(requestHeaders),
      limit: settings.bookingIpMax,
      windowSeconds: settings.bookingWindowSeconds,
    });
    const result = await createCourseRegistration({
      slug: String(formData.get("slug") || ""),
      fullName: String(formData.get("fullName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      city: String(formData.get("city") || ""),
      experience: String(formData.get("experience") || ""),
      intakeName: String(formData.get("intakeName") || ""),
      expectedStartDate: String(formData.get("expectedStartDate") || ""),
      notes: String(formData.get("notes") || ""),
      consent: formData.get("consent") === "yes",
      idempotencyKey: String(formData.get("idempotencyKey") || ""),
    });
    redirect(`/courses/registration/received?ref=${encodeURIComponent(result.registrationNumber)}&token=${encodeURIComponent(result.token)}`);
  } catch (error) {
    if (error instanceof RateLimitError) return { error: `Too many registration attempts. Wait ${error.retryAfter} seconds and try again.` };
    if (error instanceof RegistrationError) return { error: error.message };
    if (typeof error === "object" && error && "digest" in error) throw error;
    return { error: "The registration could not be sent. Your details are still on this page." };
  }
}
