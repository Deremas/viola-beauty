"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PublicBookingError, createPublicBookingRecord } from "@/lib/public-booking";
import { RateLimitError } from "@/lib/rate-limit";
import { isDbError } from "@/lib/db-errors";
import { isNextRedirect } from "@/lib/form-feedback";

export async function createPublicBooking(formData: FormData) {
  let booking;
  try {
    booking = await createPublicBookingRecord(formData, await headers());
  } catch (error) {
    if (error instanceof PublicBookingError) {
      redirect(`/book?error=${encodeURIComponent(error.code)}`);
    }
    if (error instanceof RateLimitError) {
      redirect(`/book?error=RATE_LIMITED&retryAfter=${error.retryAfter}`);
    }
    if (isNextRedirect(error)) throw error;
    if (isDbError(error)) redirect("/book?error=UNAVAILABLE");
    throw error;
  }
  redirect(`/book/success/${booking.bookingCode}`);
}
