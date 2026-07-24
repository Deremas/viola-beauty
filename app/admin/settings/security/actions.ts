"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

function bounded(formData: FormData, key: string, min: number, max: number) {
  const value = Number(formData.get(key));
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${key} is outside the allowed range`);
  return value;
}

export async function saveSecuritySettings(formData: FormData) {
  await requireAdmin();
  const data = {
    loginMax: bounded(formData, "loginMax", 3, 50),
    loginWindowSeconds: bounded(formData, "loginWindowSeconds", 60, 86400),
    bookingIpMax: bounded(formData, "bookingIpMax", 1, 100),
    bookingPhoneMax: bounded(formData, "bookingPhoneMax", 1, 50),
    bookingWindowSeconds: bounded(formData, "bookingWindowSeconds", 60, 86400),
    statusMax: bounded(formData, "statusMax", 1, 200),
    statusWindowSeconds: bounded(formData, "statusWindowSeconds", 60, 86400),
    slotsMax: bounded(formData, "slotsMax", 10, 1000),
    slotsWindowSeconds: bounded(formData, "slotsWindowSeconds", 60, 86400),
    uploadMax: bounded(formData, "uploadMax", 1, 100),
    uploadWindowSeconds: bounded(formData, "uploadWindowSeconds", 60, 86400),
  };
  await prisma.securitySetting.upsert({
    where: { id: "primary" },
    update: data,
    create: { id: "primary", ...data },
  });
  revalidatePath("/admin/settings/security");
}
