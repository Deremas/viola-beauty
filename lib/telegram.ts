import { prisma } from "@/lib/prisma";

export async function sendTelegramBookingAlert(bookingId: string, title = "New Booking Payment Uploaded") {
  try {
    await sendTelegramBookingAlertInternal(bookingId, title);
  } catch (error) {
    console.error("Telegram booking alert failed", error);
  }
}

async function sendTelegramBookingAlertInternal(bookingId: string, title: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: true,
      service: true,
      payment: { select: { requiredAdvanceAmount: true } },
    },
  });

  if (!booking || !token || !chatId) return;

  const message = [
    title,
    "",
    `Booking Code: ${booking.bookingCode}`,
    `Client: ${booking.client.fullName}`,
    `Phone: ${booking.client.phone}`,
    `Service: ${booking.service.name}`,
    `Date: ${booking.startDateTime.toLocaleDateString()}`,
    `Time: ${booking.startDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    `Source: ${booking.source}`,
    `Advance Required: ${booking.payment?.requiredAdvanceAmount ?? ""} ETB`,
  ].join("\n");

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    await prisma.notificationLog.create({
      data: {
        bookingId,
        channel: "TELEGRAM",
        recipient: chatId,
        message,
        status: response.ok ? "sent" : "failed",
        errorMessage: response.ok ? null : await response.text(),
        sentAt: response.ok ? new Date() : null,
      },
    });
  } catch (error) {
    await prisma.notificationLog.create({
      data: {
        bookingId,
        channel: "TELEGRAM",
        recipient: chatId,
        message,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
