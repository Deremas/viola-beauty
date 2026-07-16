"use server";

import type { TelegramNotificationEvent } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { encryptSecret } from "@/lib/secret";
import { telegramEventValues } from "@/lib/telegram-events";
import { sendTelegramTestMessage } from "@/lib/telegram";

const settingsPath = "/admin/settings/telegram";

function cleanRequired(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) || "").trim();
  if (!value) throw new Error(`${label} is required`);
  return value;
}

function selectedEvents(formData: FormData): TelegramNotificationEvent[] {
  if (formData.get("notifyAll") === "on") return telegramEventValues;
  const requested = new Set(formData.getAll("events").map(String));
  return telegramEventValues.filter((event) => requested.has(event));
}

export async function saveTelegramBot(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const token = String(formData.get("botToken") || "").trim();
  const existing = await prisma.telegramBotSetting.findUnique({ where: { id: "primary" } });

  if (!existing && !token) throw new Error("Bot token is required the first time you save Telegram settings");
  if (token && !/^\d+:[A-Za-z0-9_-]+$/.test(token)) throw new Error("Enter a valid Telegram bot token");

  await prisma.telegramBotSetting.upsert({
    where: { id: "primary" },
    update: {
      botTokenEncrypted: token ? encryptSecret(token) : existing!.botTokenEncrypted,
      botUsername: String(formData.get("botUsername") || "").trim().replace(/^@/, "") || null,
      isActive: formData.get("isActive") === "on",
    },
    create: {
      id: "primary",
      botTokenEncrypted: encryptSecret(token),
      botUsername: String(formData.get("botUsername") || "").trim().replace(/^@/, "") || null,
      isActive: formData.get("isActive") === "on",
    },
  });

  revalidatePath(settingsPath);
}

export async function createTelegramRecipient(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const events = selectedEvents(formData);
  if (events.length === 0) throw new Error("Choose at least one notification type");

  await prisma.telegramRecipient.create({
    data: {
      name: cleanRequired(formData, "name", "Recipient name"),
      chatId: cleanRequired(formData, "chatId", "Chat ID"),
      personalId: String(formData.get("personalId") || "").trim() || null,
      isActive: formData.get("isActive") === "on",
      subscriptions: { create: events.map((event) => ({ event })) },
    },
  });

  revalidatePath(settingsPath);
}

export async function updateTelegramRecipient(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const id = cleanRequired(formData, "id", "Recipient");
  const events = selectedEvents(formData);
  if (events.length === 0) throw new Error("Choose at least one notification type");

  await prisma.$transaction(async (tx) => {
    await tx.telegramRecipient.update({
      where: { id },
      data: {
        name: cleanRequired(formData, "name", "Recipient name"),
        chatId: cleanRequired(formData, "chatId", "Chat ID"),
        personalId: String(formData.get("personalId") || "").trim() || null,
        isActive: formData.get("isActive") === "on",
      },
    });
    await tx.telegramSubscription.deleteMany({ where: { recipientId: id } });
    await tx.telegramSubscription.createMany({
      data: events.map((event) => ({ recipientId: id, event })),
    });
  });

  revalidatePath(settingsPath);
}

export async function deleteTelegramRecipient(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  await prisma.telegramRecipient.delete({ where: { id: cleanRequired(formData, "id", "Recipient") } });
  revalidatePath(settingsPath);
}

export async function testTelegramRecipient(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  await sendTelegramTestMessage(cleanRequired(formData, "id", "Recipient"));
  revalidatePath(settingsPath);
}
