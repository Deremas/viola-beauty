import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secret";
import { shortDateTime } from "@/lib/format";
import { normalizeEthiopianPhone } from "@/lib/phone";

export type SmsEvent =
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_REJECTED"
  | "BOOKING_RESCHEDULED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED";

const preferenceFields: Record<SmsEvent, keyof Pick<
  NonNullable<Awaited<ReturnType<typeof prisma.smsSetting.findUnique>>>,
  "notifyPaymentConfirmed" | "notifyPaymentRejected" | "notifyBookingRescheduled" | "notifyBookingCancelled" | "notifyBookingCompleted"
>> = {
  PAYMENT_CONFIRMED: "notifyPaymentConfirmed",
  PAYMENT_REJECTED: "notifyPaymentRejected",
  BOOKING_RESCHEDULED: "notifyBookingRescheduled",
  BOOKING_CANCELLED: "notifyBookingCancelled",
  BOOKING_COMPLETED: "notifyBookingCompleted",
};

async function deliverSms(to: string, message: string, bookingId?: string) {
  const setting = await prisma.smsSetting.findUnique({ where: { id: "primary" } });
  if (!setting?.isActive) return { ok: false, skipped: true };

  let response: Response | null = null;
  let errorMessage: string | null = null;
  try {
    response = await fetch("https://api.afromessage.com/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptSecret(setting.apiTokenEncrypted)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: setting.identifierId,
        sender: setting.senderName,
        to,
        message,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) errorMessage = await response.text();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown SMS error";
  }

  try {
    await prisma.notificationLog.create({
      data: {
        bookingId,
        channel: "SMS",
        recipient: to,
        message,
        status: response?.ok ? "sent" : "failed",
        errorMessage,
        sentAt: response?.ok ? new Date() : null,
      },
    });
  } catch (error) {
    console.error("Could not save SMS notification log", error);
  }

  return { ok: Boolean(response?.ok), errorMessage, skipped: false };
}

export async function sendClientBookingSms(bookingId: string, event: SmsEvent, note?: string) {
  try {
    const setting = await prisma.smsSetting.findUnique({ where: { id: "primary" } });
    if (!setting?.isActive || !setting[preferenceFields[event]]) return;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, service: true, payment: true },
    });
    if (!booking) return;
    const phone = normalizeEthiopianPhone(booking.client.phone);
    if (!phone) return;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
    const statusUrl = siteUrl ? `${siteUrl}/booking-status?code=${encodeURIComponent(booking.bookingCode)}` : "";
    const messages: Record<SmsEvent, string> = {
      PAYMENT_CONFIRMED: `Viola Brows and Beauty: Your booking ${booking.bookingCode} is confirmed for ${booking.service.name} on ${shortDateTime(booking.startDateTime)}.`,
      PAYMENT_REJECTED: `Viola: Payment for ${booking.bookingCode} was not accepted.${note ? ` Reason: ${note}.` : ""} Please contact us.`,
      BOOKING_RESCHEDULED: `Viola: ${booking.bookingCode} was rescheduled to ${shortDateTime(booking.startDateTime)}.`,
      BOOKING_CANCELLED: `Viola: Booking ${booking.bookingCode} has been cancelled. Please contact us if you need help.`,
      BOOKING_COMPLETED: `Viola: Thank you for visiting. Booking ${booking.bookingCode} is complete.`,
    };
    const message = `${messages[event]}${statusUrl ? ` Check status: ${statusUrl}` : ""}`;
    await deliverSms(phone, message, booking.id);
  } catch (error) {
    console.error("Client SMS notification failed", error);
  }
}

export async function sendSmsTest(phoneValue: string) {
  const phone = normalizeEthiopianPhone(phoneValue);
  if (!phone) throw new Error("Enter a valid Ethiopian mobile number");
  const result = await deliverSms(phone, "Viola Booking System: SMS notifications are connected successfully.");
  if (result.skipped) throw new Error("Save and activate SMS alerts first");
  if (!result.ok) throw new Error(result.errorMessage || "The SMS provider rejected the test message");
}
