"use server";

import { revalidatePath } from "next/cache";
import { StaffTaskPriority, StaffTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function optionalDateTime(date: FormDataEntryValue | null, time: FormDataEntryValue | null) {
  const dateText = String(date || "").trim();
  const timeText = String(time || "").trim() || "09:00";
  return dateText ? new Date(`${dateText}T${timeText}:00`) : null;
}

export async function createTask(formData: FormData) {
  const user = await requirePermission("MANAGE_TASKS");

  await prisma.staffTask.create({
    data: {
      title: String(formData.get("title") || "").trim(),
      description: optionalString(formData.get("description")),
      status: StaffTaskStatus.TODO,
      priority: String(formData.get("priority") || "NORMAL") as StaffTaskPriority,
      assignedToUserId: optionalString(formData.get("assignedToUserId")),
      createdByUserId: user.id,
      relatedClientId: optionalString(formData.get("relatedClientId")),
      relatedBookingId: optionalString(formData.get("relatedBookingId")),
      dueAt: optionalDateTime(formData.get("dueDate"), formData.get("dueTime")),
    },
  });

  revalidatePath("/admin/tasks");
}

export async function updateTaskStatus(formData: FormData) {
  await requirePermission("MANAGE_TASKS");
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as StaffTaskStatus;

  await prisma.staffTask.update({
    where: { id },
    data: {
      status,
      completedAt: status === StaffTaskStatus.DONE ? new Date() : null,
    },
  });

  revalidatePath("/admin/tasks");
}

export async function deleteTask(formData: FormData) {
  await requirePermission("MANAGE_TASKS");
  const id = String(formData.get("id"));
  await prisma.staffTask.delete({ where: { id } });
  revalidatePath("/admin/tasks");
}
