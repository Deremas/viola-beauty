import type { Prisma, TelegramNotificationEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secret";
import { shortDateTime } from "@/lib/format";
import { isDbError } from "@/lib/db-errors";

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

function serverTelegramToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
}

export function serverTelegramChatId() {
  return process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || "";
}

export function explainTelegramFailure(raw: string) {
  const text = raw.toLowerCase();
  if (
    text.includes("chat not found") ||
    text.includes("bot was blocked") ||
    text.includes("user is deactivated") ||
    text.includes("kicked") ||
    text.includes("not a member") ||
    text.includes("have no rights") ||
    text.includes("need administrator")
  ) {
    return "This saved number is not a chat this bot can message. The person must press Start on this studio bot, and the row must use the Id @userinfobot shows for that same person. A test to your own Id shows the bot itself is fine.";
  }
  if (text.includes("unauthorized") || text.includes("bot token")) {
    return "The studio bot is not ready to send.";
  }
  if (isDbError(raw)) return "The studio records could not be reached. Nothing was saved.";
  if (raw.length > 0 && raw.length < 180 && !/prisma|postgres|sql|token/i.test(raw)) return raw;
  return "The message did not go through. Check the chat id and try again.";
}

async function readToken() {
  const envToken = serverTelegramToken();
  if (envToken) return envToken;
  try {
    const setting = await prisma.telegramBotSetting.findUnique({
      where: { id: "primary" },
      select: { botTokenEncrypted: true, isActive: true },
    });
    if (!setting?.isActive || !setting.botTokenEncrypted) return "";
    return decryptSecret(setting.botTokenEncrypted);
  } catch {
    console.warn("[telegram] saved bot setup could not be read");
    return "";
  }
}

async function loadChats(where: Prisma.TelegramRecipientWhereInput) {
  try {
    return await prisma.telegramRecipient.findMany({
      where,
      select: { name: true, chatId: true },
    });
  } catch (error) {
    console.warn("[telegram] some chats could not be loaded", isDbError(error) ? "records unavailable" : error);
    return null;
  }
}

async function getDeliverySettings(event: TelegramNotificationEvent) {
  const token = await readToken();
  if (!token) return null;

  const subscribed = { isActive: true, subscriptions: { some: { event } } };
  const [personal, groups] = await Promise.all([
    loadChats({ ...subscribed, NOT: { chatId: { startsWith: "-" } } }),
    loadChats({ ...subscribed, chatId: { startsWith: "-" } }),
  ]);

  const destinations: TelegramDestination[] = [];
  const seen = new Set<string>();
  for (const chat of [...(personal || []), ...(groups || [])]) {
    const chatId = chat.chatId.trim();
    if (!chatId || seen.has(chatId)) continue;
    seen.add(chatId);
    destinations.push({ name: chat.name, chatId });
  }

  const legacyChatId = serverTelegramChatId();
  if ((personal === null || groups === null) && legacyChatId && !seen.has(legacyChatId) && !legacyChatId.startsWith("-")) {
    destinations.push({ name: "Server chat", chatId: legacyChatId });
  } else if (personal && groups && legacyChatId && !seen.has(legacyChatId)) {
    destinations.push({ name: "Server chat", chatId: legacyChatId });
  }

  if (destinations.length === 0) return null;
  return { token, recipients: destinations };
}

function telegramChatId(chatId: string) {
  const text = chatId.trim();
  if (/^-?\d+$/.test(text)) {
    const asNumber = Number(text);
    if (Number.isSafeInteger(asNumber)) return asNumber;
  }
  return text;
}

async function deliverMessage(token: string, recipient: TelegramDestination, message: string, bookingId?: string) {
  let response: Response | null = null;
  let errorMessage: string | null = null;

  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId(recipient.chatId),
        text: message,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) errorMessage = explainTelegramFailure(await response.text());
  } catch (error) {
    errorMessage = explainTelegramFailure(error instanceof Error ? error.message : "The message did not go through.");
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

    const results = await Promise.allSettled(
      delivery.recipients.map((recipient) => deliverMessage(delivery.token, recipient, message, booking.id)),
    );
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.warn(`[telegram] ${delivery.recipients[index]?.name || "chat"} was not sent`);
      }
    });
  } catch (error) {
    console.error("Telegram booking notification failed", error);
  }
}

export async function sendTelegramTestMessage(recipientId: string) {
  const recipient = await prisma.telegramRecipient.findUnique({ where: { id: recipientId } });
  const token = await readToken();
  if (!token) throw new Error("The studio bot is not ready to send.");
  if (!recipient) throw new Error("That chat is no longer in the list.");
  if (!recipient.isActive) throw new Error("Sending is off for this chat. Turn it on from Edit, then test again.");

  const result = await deliverMessage(
    token,
    recipient,
    `Viola Brows and Beauty\n\nHello ${recipient.name}. Telegram alerts are connected.`,
  );

  if (!result.ok) throw new Error(result.errorMessage || "The message did not go through. Check the chat id and try again.");
}

// Backward-compatible helper for existing booking creation calls.
export async function sendTelegramBookingAlert(bookingId: string) {
  await sendTelegramBookingNotification(bookingId, "PAYMENT_PROOF_UPLOADED");
}
