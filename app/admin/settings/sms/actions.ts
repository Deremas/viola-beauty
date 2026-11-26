"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { encryptSecret } from "@/lib/secret";
import { sendSmsTest } from "@/lib/sms";
import { failForm } from "@/lib/form-feedback";

const settingsPath = "/admin/settings/sms";

export async function saveSmsSettings(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const token = String(formData.get("apiToken") || "").trim();
  const identifierId = String(formData.get("identifierId") || "").trim();
  const senderName = String(formData.get("senderName") || "").trim();
  const existing = await prisma.smsSetting.findUnique({ where: { id: "primary" } });

  if (!existing && !token) return failForm("The AfroMessage API key is required the first time you save SMS settings", "apiToken");
  if (!identifierId) return failForm("The AfroMessage account id is required", "identifierId");
  if (!senderName) return failForm("Sender name is required");

  await prisma.smsSetting.upsert({
    where: { id: "primary" },
    update: {
      apiTokenEncrypted: token ? encryptSecret(token) : existing!.apiTokenEncrypted,
      identifierId,
      senderName,
      isActive: formData.get("isActive") === "on",
      notifyPaymentConfirmed: true,
      notifyPaymentRejected: false,
      notifyBookingRescheduled: false,
      notifyBookingCancelled: false,
      notifyBookingCompleted: false,
    },
    create: {
      id: "primary",
      apiTokenEncrypted: encryptSecret(token),
      identifierId,
      senderName,
      isActive: formData.get("isActive") === "on",
      notifyPaymentConfirmed: true,
      notifyPaymentRejected: false,
      notifyBookingRescheduled: false,
      notifyBookingCancelled: false,
      notifyBookingCompleted: false,
    },
  });
  revalidatePath(settingsPath);
}

export async function testSmsSettings(formData: FormData) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  await sendSmsTest(String(formData.get("phone") || ""));
  revalidatePath(settingsPath);
}
