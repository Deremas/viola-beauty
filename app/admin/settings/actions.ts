"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { serviceSchema } from "@/lib/validators/booking";
import { permissionValues } from "@/lib/permission-catalog";
import { prepareServiceImage } from "@/lib/service-image";
import { getBookingSlotInterval } from "@/lib/booking-settings";
import { failForm, parseForm } from "@/lib/form-feedback";

function serviceDurationFromForm(formData: FormData) {
  return Number(formData.get("durationHours") || 0) * 60
    + Number(formData.get("durationRemainderMinutes") || 0);
}

export async function createService(formData: FormData) {
  await requirePermission("MANAGE_SERVICES");
  const data = await parseForm(serviceSchema, {
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    price: formData.get("price"),
    advanceAmount: formData.get("advanceAmount"),
    durationMinutes: serviceDurationFromForm(formData),
    bufferMinutes: formData.get("bufferMinutes"),
    bookingWarningTitle: formData.get("bookingWarningTitle"),
    bookingWarningIntro: formData.get("bookingWarningIntro"),
    bookingWarningInstructions: formData.get("bookingWarningInstructions"),
    bookingWarningContact: formData.get("bookingWarningContact"),
    bookingWarningActive: formData.get("bookingWarningActive") === "on",
    isActive: formData.get("isActive") === "on",
  });
  const image = await prepareServiceImage(formData.get("serviceImage"));
  await prisma.service.create({
    data: {
      ...data,
      image: image ? { create: image } : undefined,
    },
  });
  revalidatePath("/admin/settings/services");
}

export async function createServiceAndRedirect(formData: FormData) {
  await createService(formData);
  redirect("/admin/settings/services");
}

export async function updateService(formData: FormData) {
  await requirePermission("MANAGE_SERVICES");
  const id = String(formData.get("id"));
  const data = await parseForm(serviceSchema, {
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    price: formData.get("price"),
    advanceAmount: formData.get("advanceAmount"),
    durationMinutes: serviceDurationFromForm(formData),
    bufferMinutes: formData.get("bufferMinutes"),
    bookingWarningTitle: formData.get("bookingWarningTitle"),
    bookingWarningIntro: formData.get("bookingWarningIntro"),
    bookingWarningInstructions: formData.get("bookingWarningInstructions"),
    bookingWarningContact: formData.get("bookingWarningContact"),
    bookingWarningActive: formData.get("bookingWarningActive") === "on",
    isActive: formData.get("isActive") === "on",
  });
  const image = await prepareServiceImage(formData.get("serviceImage"));
  await prisma.service.update({
    where: { id },
    data: {
      ...data,
      image: image
        ? {
            upsert: {
              create: image,
              update: image,
            },
          }
        : undefined,
    },
  });
  revalidatePath("/admin/settings/services");
  revalidatePath("/book");
}

export async function removeServiceImage(formData: FormData) {
  await requirePermission("MANAGE_SERVICES");
  if (formData.get("confirm") !== "yes") return failForm("Confirm the removal first");
  const serviceId = String(formData.get("id"));
  await prisma.serviceImage.deleteMany({ where: { serviceId } });
  revalidatePath(`/admin/settings/services/${serviceId}/edit`);
  revalidatePath(`/admin/settings/services/${serviceId}`);
  revalidatePath("/admin/settings/services");
  revalidatePath("/");
  revalidatePath("/book");
}

export async function saveBookingSlotInterval(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const requested = Number(formData.get("slotIntervalMinutes"));
  if (requested !== 30 && requested !== 60) {
    return failForm("Choose hourly or half-hour appointment starts");
  }
  await prisma.bookingSetting.upsert({
    where: { id: "primary" },
    update: { slotIntervalMinutes: requested },
    create: { id: "primary", slotIntervalMinutes: requested },
  });
  revalidatePath("/admin/settings/availability");
  revalidatePath("/admin/calendar");
  revalidatePath("/book");
}

export async function updateServiceAndRedirect(formData: FormData) {
  await updateService(formData);
  redirect("/admin/settings/services");
}

export async function setServiceActive(formData: FormData) {
  await requirePermission("MANAGE_SERVICES");
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
  await requirePermission("MANAGE_SERVICES");
  if (formData.get("confirm") !== "yes") {
    redirect("/admin/settings/services?error=" + encodeURIComponent("Confirm before deleting a service."));
  }
  const id = String(formData.get("id"));

  await prisma.service.update({ where: { id, deletedAt: null }, data: { isActive: false, deletedAt: new Date() } });

  revalidatePath("/admin/settings/services");
  revalidatePath("/services");
  revalidatePath("/book");
}

export async function purgeService(formData: FormData) {
  await requirePermission("MANAGE_SERVICES");
  const id = String(formData.get("id"));
  if (formData.get("confirm") !== "yes") {
    redirect("/admin/settings/services?error=" + encodeURIComponent("Confirm before deleting a service."));
  }
  const service = await prisma.service.findFirst({
    where: { id, deletedAt: { not: null } },
    include: { _count: { select: { bookings: true } } },
  });
  if (!service) {
    redirect("/admin/settings/services?error=" + encodeURIComponent("That service is not in the archive."));
  }
  if (service._count.bookings > 0) {
    redirect("/admin/settings/services?error=" + encodeURIComponent(`${service.name} still has appointments, so it stays in the archive.`));
  }
  await prisma.service.delete({ where: { id } });
  revalidatePath("/admin/settings/services");
  revalidatePath("/services");
  revalidatePath("/book");
}

export async function restoreService(formData: FormData) {
  await requirePermission("MANAGE_SERVICES");
  await prisma.service.update({
    where: { id: String(formData.get("id")) },
    data: { deletedAt: null, isActive: false },
  });
  revalidatePath("/admin/settings/services");
}

export async function createBankAccount(formData: FormData) {
  await requirePermission("MANAGE_BANK_ACCOUNTS");
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

export async function createBankAccountAndRedirect(formData: FormData) {
  await createBankAccount(formData);
  redirect("/admin/settings/bank-accounts");
}

export async function updateBankAccount(formData: FormData) {
  await requirePermission("MANAGE_BANK_ACCOUNTS");
  const id = String(formData.get("id"));
  await prisma.bankAccount.update({
    where: { id, deletedAt: null },
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

export async function updateBankAccountAndRedirect(formData: FormData) {
  await updateBankAccount(formData);
  redirect("/admin/settings/bank-accounts");
}

export async function setBankAccountActive(formData: FormData) {
  await requirePermission("MANAGE_BANK_ACCOUNTS");
  await prisma.bankAccount.update({
    where: { id: String(formData.get("id")), deletedAt: null },
    data: { isActive: String(formData.get("isActive")) === "true" },
  });
  revalidatePath("/admin/settings/bank-accounts");
  revalidatePath("/book");
}

export async function archiveBankAccount(formData: FormData) {
  await requirePermission("MANAGE_BANK_ACCOUNTS");
  if (formData.get("confirm") !== "yes") return failForm("Confirm the removal first");
  await prisma.bankAccount.update({
    where: { id: String(formData.get("id")), deletedAt: null },
    data: { isActive: false, deletedAt: new Date() },
  });
  revalidatePath("/admin/settings/bank-accounts");
  revalidatePath("/book");
}

export async function restoreBankAccount(formData: FormData) {
  await requirePermission("MANAGE_BANK_ACCOUNTS");
  await prisma.bankAccount.update({
    where: { id: String(formData.get("id")) },
    data: { deletedAt: null, isActive: false },
  });
  revalidatePath("/admin/settings/bank-accounts");
}

export async function upsertWorkingHour(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
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

async function validateWorkingHours(openingTime: string, closingTime: string) {
  if (!/^\d{2}:\d{2}$/.test(openingTime) || !/^\d{2}:\d{2}$/.test(closingTime)) await failForm("Enter valid working hours", "startTime");
  if (openingTime >= closingTime) await failForm("Closing time must be after opening time", "startTime");
}

async function validateTimeAlignment(time: string, interval: number) {
  const minutes = Number(time.split(":")[1]);
  if (!Number.isInteger(minutes) || minutes % interval !== 0) {
    await failForm(interval === 60 ? "Choose a whole-hour time" : "Choose a whole-hour or half-hour time", "startTime");
  }
}

export async function saveWeeklyWorkingHours(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const interval = await getBookingSlotInterval();
  const rows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    openingTime: String(formData.get(`openingTime_${dayOfWeek}`) || "09:00"),
    closingTime: String(formData.get(`closingTime_${dayOfWeek}`) || "18:00"),
    isOpen: formData.get(`isOpen_${dayOfWeek}`) === "on",
  }));
  for (const row of rows.filter((item) => item.isOpen)) {
    await validateWorkingHours(row.openingTime, row.closingTime);
    await validateTimeAlignment(row.openingTime, interval);
    await validateTimeAlignment(row.closingTime, interval);
  }
  await prisma.$transaction(rows.map((row) => prisma.workingHour.upsert({
    where: { dayOfWeek: row.dayOfWeek },
    update: row,
    create: row,
  })));
  revalidatePath("/admin/settings/availability");
  revalidatePath("/admin/website");
  revalidatePath("/book");
  revalidatePath("/contact");
}

export async function applyWorkingHoursToDays(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const interval = await getBookingSlotInterval();
  const days = formData.getAll("days").map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  const openingTime = String(formData.get("openingTime"));
  const closingTime = String(formData.get("closingTime"));
  const isOpen = formData.get("isOpen") === "on";
  if (days.length === 0) return failForm("Choose at least one day");
  if (isOpen) {
    await validateWorkingHours(openingTime, closingTime);
    await validateTimeAlignment(openingTime, interval);
    await validateTimeAlignment(closingTime, interval);
  }
  await prisma.$transaction(days.map((dayOfWeek) => prisma.workingHour.upsert({
    where: { dayOfWeek },
    update: { openingTime, closingTime, isOpen },
    create: { dayOfWeek, openingTime, closingTime, isOpen },
  })));
  revalidatePath("/admin/settings/availability");
  revalidatePath("/admin/website");
  revalidatePath("/book");
  revalidatePath("/contact");
}

async function blockTimes(formData: FormData) {
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  if (!startTime || !endTime) await failForm("Choose a start and end time", "startTime");
  if (startTime >= endTime) await failForm("Start must be before end", "startTime");
  return { startTime, endTime };
}

function revalidateBlocks() {
  revalidatePath("/admin/settings/availability");
  revalidatePath("/admin/settings/days-off");
  revalidatePath("/book");
}

export async function createBreakTime(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const interval = await getBookingSlotInterval();
  const { startTime, endTime } = await blockTimes(formData);
  await validateTimeAlignment(startTime, interval);
  await validateTimeAlignment(endTime, interval);
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) return failForm("Choose a weekday");
  await prisma.breakTime.create({
    data: {
      dayOfWeek,
      startTime,
      endTime,
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidateBlocks();
}

export async function updateBreakTime(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const interval = await getBookingSlotInterval();
  const { startTime, endTime } = await blockTimes(formData);
  await validateTimeAlignment(startTime, interval);
  await validateTimeAlignment(endTime, interval);
  const id = String(formData.get("id"));
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) return failForm("Choose a weekday");
  await prisma.breakTime.update({
    where: { id },
    data: {
      dayOfWeek,
      startTime,
      endTime,
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidateBlocks();
}

export async function deleteBreakTime(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  if (String(formData.get("confirm")) !== "yes") return failForm("Confirm the removal first");
  await prisma.breakTime.delete({ where: { id: String(formData.get("id")) } });
  revalidateBlocks();
}

async function dayOffInput(formData: FormData, interval: number) {
  const blockKind = String(formData.get("blockKind") || "");
  const isFullDay = blockKind ? blockKind !== "partial" : formData.get("isFullDay") === "on";
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "").trim();
  if (!title) await failForm("Public title is required", "title");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) await failForm("Choose a date", "date");
  if (isFullDay) {
    return { title, date: new Date(`${date}T00:00:00.000Z`), startTime: null, endTime: null, isFullDay, note: String(formData.get("note") || "").trim() || null };
  }
  const { startTime, endTime } = await blockTimes(formData);
  await validateTimeAlignment(startTime, interval);
  await validateTimeAlignment(endTime, interval);
  return { title, date: new Date(`${date}T00:00:00.000Z`), startTime, endTime, isFullDay, note: String(formData.get("note") || "").trim() || null };
}

export async function createDayOff(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const interval = await getBookingSlotInterval();
  await prisma.dayOff.create({ data: await dayOffInput(formData, interval) });
  revalidateBlocks();
}

export async function updateDayOff(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const interval = await getBookingSlotInterval();
  const id = String(formData.get("id"));
  await prisma.dayOff.update({ where: { id }, data: await dayOffInput(formData, interval) });
  revalidateBlocks();
}

export async function deleteDayOff(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  if (String(formData.get("confirm")) !== "yes") return failForm("Confirm the removal first");
  await prisma.dayOff.delete({ where: { id: String(formData.get("id")) } });
  revalidateBlocks();
}

export async function createUser(formData: FormData) {
  const manager = await requirePermission("MANAGE_STAFF");
  const passwordHash = await bcrypt.hash(String(formData.get("password")), 10);
  const accountType = String(formData.get("accountType")) === "ADMIN" ? "ADMIN" : "RECEPTIONIST";
  if (accountType === "ADMIN" && manager.role !== "ADMIN") return failForm("Only an administrator can create another administrator");
  const staffRoleId = accountType === "ADMIN" ? null : String(formData.get("staffRoleId") || "") || null;
  if (staffRoleId) {
    const staffRole = await prisma.staffRole.findFirst({ where: { id: staffRoleId, isActive: true, deletedAt: null } });
    if (!staffRole) return failForm("Choose an active staff role");
  }
  await prisma.user.create({
    data: {
      name: String(formData.get("name")),
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      username: String(formData.get("username")),
      passwordHash,
      role: accountType,
      staffRoleId,
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/settings/users");
}

export async function createUserAndRedirect(formData: FormData) {
  await createUser(formData);
  redirect("/admin/settings/users");
}

export async function createReceptionistAndRedirect(formData: FormData) {
  await createUser(formData);
  redirect("/admin/settings/receptionists");
}

export async function updateUser(formData: FormData) {
  const admin = await requirePermission("MANAGE_STAFF");
  const id = String(formData.get("id"));
  const accountType = String(formData.get("accountType")) === "ADMIN" ? "ADMIN" : "RECEPTIONIST";
  const staffRoleId = accountType === "ADMIN" ? null : String(formData.get("staffRoleId") || "") || null;
  const password = String(formData.get("password") || "");
  const target = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { role: true } });
  if (!target) return failForm("Staff user not found");
  if (admin.role !== "ADMIN" && (target.role === "ADMIN" || accountType === "ADMIN")) return failForm("Only an administrator can manage administrator accounts");
  if (admin.id === id && (accountType !== "ADMIN" || formData.get("isActive") !== "on")) {
    return failForm("You cannot remove your own administrator access or deactivate your own account");
  }
  if (staffRoleId) {
    const staffRole = await prisma.staffRole.findFirst({ where: { id: staffRoleId, isActive: true, deletedAt: null } });
    if (!staffRole) return failForm("Choose an active staff role");
  }
  await prisma.user.update({
    where: { id, deletedAt: null },
    data: {
      name: String(formData.get("name")).trim(),
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      username: String(formData.get("username")).trim(),
      role: accountType,
      staffRoleId,
      isActive: formData.get("isActive") === "on",
      passwordHash: password ? await bcrypt.hash(password, 10) : undefined,
    },
  });
  revalidatePath("/admin/settings/users");
}

export async function updateUserAndRedirect(formData: FormData) {
  await updateUser(formData);
  redirect("/admin/settings/users");
}

export async function setUserActive(formData: FormData) {
  const admin = await requirePermission("MANAGE_STAFF");
  const id = String(formData.get("id"));
  const isActive = String(formData.get("isActive")) === "true";
  const target = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { role: true } });
  if (admin.role !== "ADMIN" && target?.role === "ADMIN") return failForm("Only an administrator can manage administrator accounts");
  if (admin.id === id && !isActive) return failForm("You cannot deactivate your own account");
  await prisma.user.update({ where: { id, deletedAt: null }, data: { isActive } });
  revalidatePath("/admin/settings/users");
}

export async function archiveUser(formData: FormData) {
  const admin = await requirePermission("MANAGE_STAFF");
  if (formData.get("confirm") !== "yes") return failForm("Confirm the removal first");
  const id = String(formData.get("id"));
  const target = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { role: true } });
  if (admin.role !== "ADMIN" && target?.role === "ADMIN") return failForm("Only an administrator can manage administrator accounts");
  if (admin.id === id) return failForm("You cannot archive your own account");
  await prisma.user.update({ where: { id, deletedAt: null }, data: { isActive: false, deletedAt: new Date() } });
  revalidatePath("/admin/settings/users");
}

export async function restoreUser(formData: FormData) {
  await requirePermission("MANAGE_STAFF");
  await prisma.user.update({ where: { id: String(formData.get("id")) }, data: { deletedAt: null, isActive: false } });
  revalidatePath("/admin/settings/users");
}

function selectedPermissions(formData: FormData) {
  const selected = new Set(formData.getAll("permissions").map(String));
  return permissionValues.filter((permission) => selected.has(permission));
}

export async function createStaffRole(formData: FormData) {
  await requirePermission("MANAGE_ROLES");
  const permissions = selectedPermissions(formData);
  if (permissions.length === 0) return failForm("Choose at least one permission");
  await prisma.staffRole.create({
    data: {
      name: String(formData.get("name")).trim(),
      description: String(formData.get("description") || "").trim() || null,
      isActive: formData.get("isActive") === "on",
      permissions: { create: permissions.map((permission) => ({ permission })) },
    },
  });
  revalidatePath("/admin/settings/roles");
}

export async function createStaffRoleAndRedirect(formData: FormData) {
  await createStaffRole(formData);
  redirect("/admin/settings/roles");
}

export async function updateStaffRole(formData: FormData) {
  await requirePermission("MANAGE_ROLES");
  const id = String(formData.get("id"));
  const permissions = selectedPermissions(formData);
  if (permissions.length === 0) return failForm("Choose at least one permission");
  await prisma.$transaction(async (tx) => {
    await tx.staffRole.update({
      where: { id, deletedAt: null },
      data: {
        name: String(formData.get("name")).trim(),
        description: String(formData.get("description") || "").trim() || null,
        isActive: formData.get("isActive") === "on",
      },
    });
    await tx.rolePermission.deleteMany({ where: { staffRoleId: id } });
    await tx.rolePermission.createMany({ data: permissions.map((permission) => ({ staffRoleId: id, permission })) });
  });
  revalidatePath("/admin/settings/roles");
}

export async function updateStaffRoleAndRedirect(formData: FormData) {
  await updateStaffRole(formData);
  redirect("/admin/settings/roles");
}

export async function setStaffRoleActive(formData: FormData) {
  await requirePermission("MANAGE_ROLES");
  await prisma.staffRole.update({
    where: { id: String(formData.get("id")), deletedAt: null },
    data: { isActive: String(formData.get("isActive")) === "true" },
  });
  revalidatePath("/admin/settings/roles");
}

export async function archiveStaffRole(formData: FormData) {
  await requirePermission("MANAGE_ROLES");
  if (formData.get("confirm") !== "yes") return failForm("Confirm the removal first");
  const id = String(formData.get("id"));
  const assignedUsers = await prisma.user.count({ where: { staffRoleId: id, deletedAt: null } });
  if (assignedUsers > 0) return failForm("Reassign or archive staff using this role first");
  await prisma.staffRole.update({ where: { id, deletedAt: null }, data: { isActive: false, deletedAt: new Date() } });
  revalidatePath("/admin/settings/roles");
}

export async function restoreStaffRole(formData: FormData) {
  await requirePermission("MANAGE_ROLES");
  await prisma.staffRole.update({ where: { id: String(formData.get("id")) }, data: { deletedAt: null, isActive: false } });
  revalidatePath("/admin/settings/roles");
}
