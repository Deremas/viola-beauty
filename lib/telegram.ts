import type { TelegramNotificationEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secret";
import { shortDateTime } from "@/lib/format";

const eventTitles: Record<TelegramNotificationEvent, string> = {
  PAYMENT_PROOF_UPLOADED: "Payment proof uploaded",
  PAYMENT_CONFIRMED: "Payment confirmed - booking confirmed",
  PAYMENT_REJECTED: "Payment proof rejected",
  BOOKING_RESCHEDULED: "Booking rescheduled",
  BOOKING_COMPLETED: "Booking completed",
  BOOKING_CANCELLED: "Booking cancelled",
  BOOKING_NO_SHOW: "Client did not arrive",
};

type TelegramDestination = {
  name: string;
  chatId: string;
};

async function getDeliverySettings(event: TelegramNotificationEvent) {
  try {
    const [setting, recipients] = await Promise.all([
      prisma.telegramBotSetting.findUnique({ where: { id: "primary" } }),
      prisma.telegramRecipient.findMany({
        where: {
          isActive: true,
          subscriptions: { some: { event } },
        },
        select: { name: true, chatId: true },
      }),
    ]);

    if (setting) {
      if (!setting.isActive || recipients.length === 0) return null;

      return {
        token: decryptSecret(setting.botTokenEncrypted),
        recipients,
      };
    }
  } catch (error) {
    console.error("Could not load Telegram settings from the database", error);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return null;

  return {
    token,
    recipients: [{ name: "Environment recipient", chatId }],
  };
}

async function deliverMessage(token: string, recipient: TelegramDestination, message: string, bookingId?: string) {
  let response: Response | null = null;
  let errorMessage: string | null = null;

  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: recipient.chatId,
        text: message,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) errorMessage = await response.text();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown Telegram error";
  }

  try {
    await prisma.notificationLog.create({
      data: {
        bookingId,
        channel: "TELEGRAM",
        recipient: `${recipient.name} (${recipient.chatId})`,
        message,
        status: response?.ok ? "sent" : "failed",
        errorMessage,
        sentAt: response?.ok ? new Date() : null,
      },
    });
  } catch (error) {
    console.error("Could not save Telegram notification log", error);
  }

  return { ok: Boolean(response?.ok), errorMessage };
}

export async function sendTelegramBookingNotification(
  bookingId: string,
  event: TelegramNotificationEvent,
  note?: string,
) {
  try {
    const delivery = await getDeliverySettings(event);
    if (!delivery) return;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        service: true,
        bookedBy: true,
        payment: {
          select: {
            requiredAdvanceAmount: true,
            paidAmount: true,
            paymentStatus: true,
            bankAccount: true,
          },
        },
      },
    });
    if (!booking) return;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
    const message = [
      eventTitles[event],
      "",
      `Booking: ${booking.bookingCode}`,
      `Client: ${booking.client.fullName}`,
      `Phone: ${booking.client.phone}`,
      `Service: ${booking.service.name}`,
      `Appointment: ${shortDateTime(booking.startDateTime)}`,
      `Status: ${booking.status.replaceAll("_", " ")}`,
      `Payment: ${booking.payment?.paymentStatus.replaceAll("_", " ") || "No payment"}`,
      `Advance: ${booking.payment?.requiredAdvanceAmount || 0} ETB`,
      booking.payment?.bankAccount
        ? `Bank: ${booking.payment.bankAccount.bankName} - ${booking.payment.bankAccount.accountNumber}`
        : null,
      `Booked by: ${booking.bookedBy?.name || "Online client"}`,
      note ? `Note: ${note}` : null,
      siteUrl ? `Open booking: ${siteUrl}/admin/bookings/${booking.id}` : null,
    ].filter(Boolean).join("\n");

    await Promise.all(
      delivery.recipients.map((recipient) => deliverMessage(delivery.token, recipient, message, booking.id)),
    );
  } catch (error) {
    console.error("Telegram booking notification failed", error);
  }
}

export async function sendTelegramTestMessage(recipientId: string) {
  const [setting, recipient] = await Promise.all([
    prisma.telegramBotSetting.findUnique({ where: { id: "primary" } }),
    prisma.telegramRecipient.findUnique({ where: { id: recipientId } }),
  ]);

  if (!setting?.isActive) throw new Error("Save and activate the Telegram bot first");
  if (!recipient?.isActive) throw new Error("This recipient is inactive");

  const result = await deliverMessage(
    decryptSecret(setting.botTokenEncrypted),
    recipient,
    `Viola Booking System test notification\n\nHello ${recipient.name}. Telegram alerts are connected successfully.`,
  );

  if (!result.ok) throw new Error(result.errorMessage || "Telegram rejected the test message");
}

// Backward-compatible helper for existing booking creation calls.
export async function sendTelegramBookingAlert(bookingId: string) {
  await sendTelegramBookingNotification(bookingId, "PAYMENT_PROOF_UPLOADED");
}
