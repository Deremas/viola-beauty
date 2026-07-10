"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { serviceSchema } from "@/lib/validators/booking";

export async function createService(formData: FormData) {
  await requireAdmin();
  const data = serviceSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    price: formData.get("price"),
    advanceAmount: formData.get("advanceAmount"),
    durationMinutes: formData.get("durationMinutes"),
    bufferMinutes: formData.get("bufferMinutes"),
    isActive: formData.get("isActive") === "on",
  });
  await prisma.service.create({ data });
  revalidatePath("/admin/settings/services");
}

export async function createServiceAndRedirect(formData: FormData) {
  await createService(formData);
  redirect("/admin/settings/services");
}

export async function updateService(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = serviceSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    price: formData.get("price"),
    advanceAmount: formData.get("advanceAmount"),
    durationMinutes: formData.get("durationMinutes"),
    bufferMinutes: formData.get("bufferMinutes"),
    isActive: formData.get("isActive") === "on",
  });
  await prisma.service.update({ where: { id }, data });
  revalidatePath("/admin/settings/services");
  revalidatePath("/book");
}

export async function updateServiceAndRedirect(formData: FormData) {
  await updateService(formData);
  redirect("/admin/settings/services");
}

export async function setServiceActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const isActive = String(formData.get("isActive")) === "true";

  await prisma.service.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/settings/services");
  revalidatePath("/book");
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));

  await prisma.service.delete({ where: { id } });

  revalidatePath("/admin/settings/services");
  revalidatePath("/book");
}

export async function createBankAccount(formData: FormData) {
  await requireAdmin();
  await prisma.bankAccount.create({
    data: {
      bankName: String(formData.get("bankName")),
      accountName: String(formData.get("accountName")),
      accountNumber: String(formData.get("accountNumber")),
      instructions: String(formData.get("instructions") || ""),
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/settings/bank-accounts");
}

export async function updateBankAccount(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.bankAccount.update({
    where: { id },
    data: {
      bankName: String(formData.get("bankName")),
      accountName: String(formData.get("accountName")),
      accountNumber: String(formData.get("accountNumber")),
      instructions: String(formData.get("instructions") || ""),
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/settings/bank-accounts");
  revalidatePath("/book");
}

export async function upsertWorkingHour(formData: FormData) {
  await requireAdmin();
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  await prisma.workingHour.upsert({
    where: { dayOfWeek },
    update: {
      openingTime: String(formData.get("openingTime")),
      closingTime: String(formData.get("closingTime")),
      isOpen: formData.get("isOpen") === "on",
    },
    create: {
      dayOfWeek,
      openingTime: String(formData.get("openingTime")),
      closingTime: String(formData.get("closingTime")),
      isOpen: formData.get("isOpen") === "on",
    },
  });
  revalidatePath("/admin/settings/availability");
}

export async function createBreakTime(formData: FormData) {
  await requireAdmin();
  await prisma.breakTime.create({
    data: {
      dayOfWeek: Number(formData.get("dayOfWeek")),
      startTime: String(formData.get("startTime")),
      endTime: String(formData.get("endTime")),
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/settings/availability");
}

export async function updateBreakTime(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.breakTime.update({
    where: { id },
    data: {
      dayOfWeek: Number(formData.get("dayOfWeek")),
      startTime: String(formData.get("startTime")),
      endTime: String(formData.get("endTime")),
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/settings/availability");
}

export async function createDayOff(formData: FormData) {
  await requireAdmin();
  await prisma.dayOff.create({
    data: {
      title: String(formData.get("title")),
      date: new Date(String(formData.get("date"))),
      startTime: String(formData.get("startTime") || "") || null,
      endTime: String(formData.get("endTime") || "") || null,
      isFullDay: formData.get("isFullDay") === "on",
      note: String(formData.get("note") || "") || null,
    },
  });
  revalidatePath("/admin/settings/days-off");
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const passwordHash = await bcrypt.hash(String(formData.get("password")), 10);
  await prisma.user.create({
    data: {
      name: String(formData.get("name")),
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      username: String(formData.get("username")),
      passwordHash,
      role: String(formData.get("role")) === "ADMIN" ? "ADMIN" : "RECEPTIONIST",
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/settings/users");
}
