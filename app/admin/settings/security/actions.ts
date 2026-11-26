"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { failForm } from "@/lib/form-feedback";

async function bounded(formData: FormData, key: string, min: number, max: number) {
  const value = Number(formData.get(key));
  if (!Number.isInteger(value) || value < min || value > max) {
    await failForm(`${key} is outside the allowed range`, key);
  }
  return value;
}

export async function saveSecuritySettings(formData: FormData) {
  await requireAdmin();
  const data = {
    sessionDurationDays: await bounded(formData, "sessionDurationDays", 1, 30),
    loginMax: await bounded(formData, "loginMax", 3, 50),
    loginWindowSeconds: await bounded(formData, "loginWindowSeconds", 60, 86400),
    bookingIpMax: await bounded(formData, "bookingIpMax", 1, 100),
    bookingPhoneMax: await bounded(formData, "bookingPhoneMax", 1, 50),
    bookingWindowSeconds: await bounded(formData, "bookingWindowSeconds", 60, 86400),
    statusMax: await bounded(formData, "statusMax", 1, 200),
    statusWindowSeconds: await bounded(formData, "statusWindowSeconds", 60, 86400),
    slotsMax: await bounded(formData, "slotsMax", 10, 1000),
    slotsWindowSeconds: await bounded(formData, "slotsWindowSeconds", 60, 86400),
    uploadMax: await bounded(formData, "uploadMax", 1, 100),
    uploadWindowSeconds: await bounded(formData, "uploadWindowSeconds", 60, 86400),
  };
  await prisma.securitySetting.upsert({
    where: { id: "primary" },
    update: data,
    create: { id: "primary", ...data },
  });
  revalidatePath("/admin/settings/security");
}
