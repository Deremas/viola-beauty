"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PublicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { centsToDecimalString, parseMoneyToCents } from "@/lib/courses/money";
import { cleanLine, cleanMultiline } from "@/lib/courses/transitions";

export async function saveCourse(formData: FormData) {
  await requirePermission("MANAGE_COURSES");
  const id = String(formData.get("id") || "");
  const fee = String(formData.get("fee") || "").trim();
  const feeCents = fee ? parseMoneyToCents(fee) : null;
  if (fee && feeCents == null) redirect(`/admin/courses/${id}?error=fee`);
  const publicationStatus = String(formData.get("publicationStatus") || "DRAFT");
  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(publicationStatus)) redirect(`/admin/courses/${id}`);
  if (publicationStatus !== "DRAFT") await requirePermission("PUBLISH_COURSES");
  await prisma.course.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "").trim(),
      shortDescription: String(formData.get("shortDescription") || "").trim(),
      fullDescription: String(formData.get("fullDescription") || "").trim(),
      fee: feeCents == null ? null : centsToDecimalString(feeCents),
      feePublished: formData.get("feePublished") === "yes" && feeCents != null,
      durationLabel: String(formData.get("durationLabel") || "").trim(),
      durationPublished: formData.get("durationPublished") === "yes",
      publicationStatus: publicationStatus as PublicationStatus,
      registrationOpen: formData.get("registrationOpen") === "yes",
      featured: formData.get("featured") === "yes",
    },
  });
  revalidatePath("/courses");
  revalidatePath(`/admin/courses/${id}`);
  redirect(`/admin/courses/${id}`);
}

function courseBack(courseId: string, message?: string): never {
  const query = message ? `?error=${encodeURIComponent(message)}` : "";
  redirect(`/admin/courses/${courseId}${query}`);
}

export async function addModule(formData: FormData) {
  const user = await requirePermission("MANAGE_COURSES");
  const courseId = String(formData.get("courseId") || "");
  const title = cleanLine(String(formData.get("title") || ""), 160);
  const kind = cleanLine(String(formData.get("kind") || "Module"), 40) || "Module";
  const summary = cleanMultiline(String(formData.get("summary") || ""), 500);
  if (title.length < 2) courseBack(courseId, "Enter a module title.");
  const existing = await prisma.courseModule.findMany({ where: { courseId }, orderBy: { displayOrder: "asc" } });
  await prisma.courseModule.create({ data: { courseId, title, kind, summary: summary || null, displayOrder: existing.length + 1 } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "course.module.add", entityType: "Course", entityId: courseId, summary: `Added module ${title}` } });
  revalidatePath(`/courses`);
  courseBack(courseId);
}

export async function moveModule(formData: FormData) {
  await requirePermission("MANAGE_COURSES");
  const courseId = String(formData.get("courseId") || "");
  const id = String(formData.get("id") || "");
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const modules = await prisma.courseModule.findMany({ where: { courseId }, orderBy: { displayOrder: "asc" } });
  const index = modules.findIndex((module) => module.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= modules.length) courseBack(courseId);
  const next = [...modules];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  await prisma.$transaction(next.map((module, order) => prisma.courseModule.update({ where: { id: module.id }, data: { displayOrder: order + 1 } })));
  revalidatePath("/courses");
  courseBack(courseId);
}

export async function deleteModule(formData: FormData) {
  const user = await requirePermission("MANAGE_COURSES");
  const courseId = String(formData.get("courseId") || "");
  const id = String(formData.get("id") || "");
  if (formData.get("confirm") !== "yes") courseBack(courseId, "Confirm before deleting a module.");
  const existingModule = await prisma.courseModule.findFirst({ where: { id, courseId } });
  if (!existingModule) courseBack(courseId, "That module is not on this course.");
  await prisma.courseModule.delete({ where: { id } });
  const remaining = await prisma.courseModule.findMany({ where: { courseId }, orderBy: { displayOrder: "asc" } });
  await prisma.$transaction(remaining.map((module, order) => prisma.courseModule.update({ where: { id: module.id }, data: { displayOrder: order + 1 } })));
  await prisma.auditLog.create({ data: { actorId: user.id, action: "course.module.delete", entityType: "Course", entityId: courseId, summary: "Deleted a course module and its topics" } });
  revalidatePath("/courses");
  courseBack(courseId);
}

export async function addTopic(formData: FormData) {
  await requirePermission("MANAGE_COURSES");
  const courseId = String(formData.get("courseId") || "");
  const moduleId = String(formData.get("moduleId") || "");
  const title = cleanLine(String(formData.get("title") || ""), 160);
  if (title.length < 2) courseBack(courseId, "Enter a topic title.");
  const courseModule = await prisma.courseModule.findFirst({ where: { id: moduleId, courseId } });
  if (!courseModule) courseBack(courseId, "That module is not on this course.");
  const count = await prisma.courseTopic.count({ where: { moduleId } });
  await prisma.courseTopic.create({ data: { moduleId, title, displayOrder: count + 1 } });
  revalidatePath("/courses");
  courseBack(courseId);
}

export async function deleteTopic(formData: FormData) {
  await requirePermission("MANAGE_COURSES");
  const courseId = String(formData.get("courseId") || "");
  const moduleId = String(formData.get("moduleId") || "");
  const id = String(formData.get("id") || "");
  const topic = await prisma.courseTopic.findFirst({ where: { id, moduleId, module: { courseId } } });
  if (!topic) courseBack(courseId);
  await prisma.courseTopic.delete({ where: { id } });
  const remaining = await prisma.courseTopic.findMany({ where: { moduleId }, orderBy: { displayOrder: "asc" } });
  await prisma.$transaction(remaining.map((item, order) => prisma.courseTopic.update({ where: { id: item.id }, data: { displayOrder: order + 1 } })));
  revalidatePath("/courses");
  courseBack(courseId);
}
