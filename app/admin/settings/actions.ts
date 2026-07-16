"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { serviceSchema } from "@/lib/validators/booking";
import { permissionValues } from "@/lib/permission-catalog";

export async function createService(formData: FormData) {
  await requirePermission("MANAGE_SERVICES");
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
  await requirePermission("MANAGE_SERVICES");
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
  const id = String(formData.get("id"));

  await prisma.service.update({ where: { id, deletedAt: null }, data: { isActive: false, deletedAt: new Date() } });

  revalidatePath("/admin/settings/services");
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

function validateWorkingHours(openingTime: string, closingTime: string) {
  if (!/^\d{2}:\d{2}$/.test(openingTime) || !/^\d{2}:\d{2}$/.test(closingTime)) throw new Error("Enter valid working hours");
  if (openingTime >= closingTime) throw new Error("Closing time must be after opening time");
}

export async function saveWeeklyWorkingHours(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const rows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    openingTime: String(formData.get(`openingTime_${dayOfWeek}`) || "09:00"),
    closingTime: String(formData.get(`closingTime_${dayOfWeek}`) || "18:00"),
    isOpen: formData.get(`isOpen_${dayOfWeek}`) === "on",
  }));
  rows.filter((row) => row.isOpen).forEach((row) => validateWorkingHours(row.openingTime, row.closingTime));
  await prisma.$transaction(rows.map((row) => prisma.workingHour.upsert({
    where: { dayOfWeek: row.dayOfWeek },
    update: row,
    create: row,
  })));
  revalidatePath("/admin/settings/availability");
  revalidatePath("/book");
}

export async function applyWorkingHoursToDays(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const days = formData.getAll("days").map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  const openingTime = String(formData.get("openingTime"));
  const closingTime = String(formData.get("closingTime"));
  const isOpen = formData.get("isOpen") === "on";
  if (days.length === 0) throw new Error("Choose at least one day");
  if (isOpen) validateWorkingHours(openingTime, closingTime);
  await prisma.$transaction(days.map((dayOfWeek) => prisma.workingHour.upsert({
    where: { dayOfWeek },
    update: { openingTime, closingTime, isOpen },
    create: { dayOfWeek, openingTime, closingTime, isOpen },
  })));
  revalidatePath("/admin/settings/availability");
  revalidatePath("/book");
}

export async function createBreakTime(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
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
  await requirePermission("MANAGE_AVAILABILITY");
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

export async function deleteBreakTime(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  await prisma.breakTime.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/settings/availability");
  revalidatePath("/book");
}

export async function createDayOff(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const isFullDay = formData.get("isFullDay") === "on";
  const startTime = String(formData.get("startTime") || "") || null;
  const endTime = String(formData.get("endTime") || "") || null;
  if (!isFullDay && (!startTime || !endTime || startTime >= endTime)) throw new Error("Choose a valid start and end time for a partial day off");
  await prisma.dayOff.create({
    data: {
      title: String(formData.get("title")),
      date: new Date(String(formData.get("date"))),
      startTime: isFullDay ? null : startTime,
      endTime: isFullDay ? null : endTime,
      isFullDay,
      note: String(formData.get("note") || "") || null,
    },
  });
  revalidatePath("/admin/settings/days-off");
}

export async function updateDayOff(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  const id = String(formData.get("id"));
  const isFullDay = formData.get("isFullDay") === "on";
  const startTime = String(formData.get("startTime") || "") || null;
  const endTime = String(formData.get("endTime") || "") || null;
  if (!isFullDay && (!startTime || !endTime || startTime >= endTime)) throw new Error("Choose a valid start and end time for a partial day off");
  await prisma.dayOff.update({ where: { id }, data: {
    title: String(formData.get("title")).trim(),
    date: new Date(String(formData.get("date"))),
    startTime: isFullDay ? null : startTime,
    endTime: isFullDay ? null : endTime,
    isFullDay,
    note: String(formData.get("note") || "").trim() || null,
  } });
  revalidatePath("/admin/settings/days-off");
  revalidatePath("/book");
}

export async function deleteDayOff(formData: FormData) {
  await requirePermission("MANAGE_AVAILABILITY");
  await prisma.dayOff.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/settings/days-off");
  revalidatePath("/book");
}

export async function createUser(formData: FormData) {
  const manager = await requirePermission("MANAGE_STAFF");
  const passwordHash = await bcrypt.hash(String(formData.get("password")), 10);
  const accountType = String(formData.get("accountType")) === "ADMIN" ? "ADMIN" : "RECEPTIONIST";
  if (accountType === "ADMIN" && manager.role !== "ADMIN") throw new Error("Only an administrator can create another administrator");
  const staffRoleId = accountType === "ADMIN" ? null : String(formData.get("staffRoleId") || "") || null;
  if (staffRoleId) {
    const staffRole = await prisma.staffRole.findFirst({ where: { id: staffRoleId, isActive: true, deletedAt: null } });
    if (!staffRole) throw new Error("Choose an active staff role");
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
  if (!target) throw new Error("Staff user not found");
  if (admin.role !== "ADMIN" && (target.role === "ADMIN" || accountType === "ADMIN")) throw new Error("Only an administrator can manage administrator accounts");
  if (admin.id === id && (accountType !== "ADMIN" || formData.get("isActive") !== "on")) {
    throw new Error("You cannot remove your own administrator access or deactivate your own account");
  }
  if (staffRoleId) {
    const staffRole = await prisma.staffRole.findFirst({ where: { id: staffRoleId, isActive: true, deletedAt: null } });
    if (!staffRole) throw new Error("Choose an active staff role");
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
  if (admin.role !== "ADMIN" && target?.role === "ADMIN") throw new Error("Only an administrator can manage administrator accounts");
  if (admin.id === id && !isActive) throw new Error("You cannot deactivate your own account");
  await prisma.user.update({ where: { id, deletedAt: null }, data: { isActive } });
  revalidatePath("/admin/settings/users");
}

export async function archiveUser(formData: FormData) {
  const admin = await requirePermission("MANAGE_STAFF");
  const id = String(formData.get("id"));
  const target = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { role: true } });
  if (admin.role !== "ADMIN" && target?.role === "ADMIN") throw new Error("Only an administrator can manage administrator accounts");
  if (admin.id === id) throw new Error("You cannot archive your own account");
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
  if (permissions.length === 0) throw new Error("Choose at least one permission");
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
  if (permissions.length === 0) throw new Error("Choose at least one permission");
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
  const id = String(formData.get("id"));
  const assignedUsers = await prisma.user.count({ where: { staffRoleId: id, deletedAt: null } });
  if (assignedUsers > 0) throw new Error("Reassign or archive staff using this role first");
  await prisma.staffRole.update({ where: { id, deletedAt: null }, data: { isActive: false, deletedAt: new Date() } });
  revalidatePath("/admin/settings/roles");
}

export async function restoreStaffRole(formData: FormData) {
  await requirePermission("MANAGE_ROLES");
  await prisma.staffRole.update({ where: { id: String(formData.get("id")) }, data: { deletedAt: null, isActive: false } });
  revalidatePath("/admin/settings/roles");
}
