"use server";

import { Prisma, type TelegramNotificationEvent } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { telegramEventValues } from "@/lib/telegram-events";
import { parseTelegramDestinationChatId } from "@/lib/telegram-chat-id";
import { explainTelegramFailure, sendTelegramTestMessage } from "@/lib/telegram";
import { failForm, isNextRedirect } from "@/lib/form-feedback";
import { isDbError } from "@/lib/db-errors";

const settingsPath = "/admin/settings/telegram";

async function cleanRequired(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) || "").trim();
  if (!value) await failForm(`${label} is required`, key);
  return value;
}

function selectedEvents(formData: FormData): TelegramNotificationEvent[] {
  if (formData.get("notifyAll") === "on") return telegramEventValues;
  const requested = new Set(formData.getAll("events").map(String));
  return telegramEventValues.filter((event) => requested.has(event));
}

export async function createTelegramRecipient(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const events = selectedEvents(formData);
  if (events.length === 0) return failForm("Choose at least one notification type");
  const chatId = parseTelegramDestinationChatId(await cleanRequired(formData, "chatId", "Chat ID"));
  if (!chatId) return failForm("Chat id must be a number. Groups and channels start with -.");

  try {
    await prisma.telegramRecipient.create({
      data: {
        name: await cleanRequired(formData, "name", "Name"),
        chatId,
        isActive: true,
        subscriptions: { create: events.map((event) => ({ event })) },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return failForm("That chat id is already in the list", "chatId");
    }
    if (isDbError(error)) return failForm("The studio records could not be reached. Nothing was saved.");
    throw error;
  }

  revalidatePath(settingsPath);
}

export async function updateTelegramRecipient(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const id = await cleanRequired(formData, "id", "Recipient");
  const events = selectedEvents(formData);
  if (events.length === 0) return failForm("Choose at least one notification type");
  const chatId = parseTelegramDestinationChatId(await cleanRequired(formData, "chatId", "Chat ID"));
  if (!chatId) return failForm("Chat id must be a number. Groups and channels start with -.");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.telegramRecipient.update({
        where: { id },
        data: {
          name: await cleanRequired(formData, "name", "Name"),
          chatId,
          isActive: formData.get("isActive") === "on",
        },
      });
      await tx.telegramSubscription.deleteMany({ where: { recipientId: id } });
      await tx.telegramSubscription.createMany({
        data: events.map((event) => ({ recipientId: id, event })),
      });
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return failForm("That chat id is already in the list", "chatId");
    }
    if (isDbError(error)) return failForm("The studio records could not be reached. Nothing was saved.");
    throw error;
  }

  revalidatePath(settingsPath);
  revalidatePath(`${settingsPath}/${id}`);
  redirect(`${settingsPath}/${id}`);
}

export async function deleteTelegramRecipient(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  if (String(formData.get("confirm")) !== "yes") return failForm("Confirm the removal first");
  await prisma.telegramRecipient.delete({ where: { id: await cleanRequired(formData, "id", "Recipient") } });
  revalidatePath(settingsPath);
  redirect(settingsPath);
}

function safeReturn(formData: FormData, fallback: string) {
  const value = String(formData.get("returnTo") || "");
  if (value.startsWith("/admin/settings/telegram") && !value.includes("?") && !value.includes("//")) return value;
  return fallback;
}

export async function testTelegramRecipient(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const id = await cleanRequired(formData, "id", "Recipient");
  const back = safeReturn(formData, `${settingsPath}/${id}`);
  try {
    await sendTelegramTestMessage(id);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const message = error instanceof Error ? error.message : "The message did not go through.";
    return failForm(explainTelegramFailure(message));
  }
  revalidatePath(settingsPath);
  revalidatePath(`${settingsPath}/${id}`);
  redirect(`${back}?notice=${encodeURIComponent("Test message sent. If it does not appear, that person must press Start on the studio bot, and this row must use the Id @userinfobot shows for them.")}`);
}
