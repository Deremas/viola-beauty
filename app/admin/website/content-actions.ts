"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { GalleryKind, PublicationStatus, TestimonialKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { readImageFile } from "@/lib/courses/images";
import { cleanLine, cleanMultiline } from "@/lib/courses/transitions";

function back(path: string, message?: string): never {
  const query = message ? `?error=${encodeURIComponent(message)}` : "";
  redirect(`${path}${query}`);
}

function publication(value: string): PublicationStatus {
  if (value === "PUBLISHED" || value === "ARCHIVED" || value === "DRAFT") return value;
  return "DRAFT";
}

function orderOf(value: FormDataEntryValue | null) {
  const parsed = Number(String(value || "0"));
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) return 0;
  return parsed;
}

export async function saveGalleryAsset(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const title = cleanLine(String(formData.get("title") || ""), 120);
  const altText = cleanLine(String(formData.get("altText") || ""), 180);
  const caption = cleanMultiline(String(formData.get("caption") || ""), 400);
  const kind = String(formData.get("kind") || "STUDIO");
  const consent = formData.get("consentRecorded") === "yes";
  const requested = publication(String(formData.get("publicationStatus") || "DRAFT"));
  if (title.length < 2 || altText.length < 2) back("/admin/website/gallery", "Enter a title and alt text.");
  if (kind !== "STUDIO" && kind !== "TRAINING" && kind !== "RESULT") back("/admin/website/gallery", "Choose a gallery type.");
  let before: Awaited<ReturnType<typeof readImageFile>> = null;
  let after: Awaited<ReturnType<typeof readImageFile>> = null;
  try {
    before = await readImageFile(formData.get("before"));
    after = await readImageFile(formData.get("after"));
  } catch (error) {
    back("/admin/website/gallery", error instanceof Error ? error.message : "The image could not be read.");
  }
  if (!before) back("/admin/website/gallery", "Add the first photograph.");
  if (kind === "RESULT" && (!consent || !after)) back("/admin/website/gallery", "A result needs consent and both a before and an after photograph.");
  const status: PublicationStatus = kind === "RESULT" && requested === "PUBLISHED" && (!consent || !before || !after) ? "DRAFT" : requested;
  const asset = await prisma.galleryAsset.create({
    data: {
      title,
      altText,
      caption: caption || null,
      kind: kind as GalleryKind,
      consentRecorded: consent,
      consentNote: cleanLine(String(formData.get("consentNote") || ""), 240) || null,
      publicationStatus: status,
      displayOrder: orderOf(formData.get("displayOrder")),
      beforeType: before.type,
      beforeSize: before.size,
      beforeData: before.data,
      afterType: after?.type,
      afterSize: after?.size,
      afterData: after?.data,
    },
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "gallery.create", entityType: "GalleryAsset", entityId: asset.id, summary: `Added gallery item ${title}` } });
  revalidatePath("/gallery");
  revalidatePath("/");
  back("/admin/website/gallery");
}

export async function updateGalleryAsset(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const id = String(formData.get("id") || "");
  const asset = await prisma.galleryAsset.findUnique({ where: { id }, select: { id: true, kind: true, title: true, beforeSize: true, afterSize: true } });
  if (!asset) back("/admin/website/gallery", "That photograph was not found.");
  const consent = formData.get("consentRecorded") === "yes";
  const requested = publication(String(formData.get("publicationStatus") || "DRAFT"));
  if (requested === "PUBLISHED" && asset.kind === "RESULT" && (!consent || !asset.beforeSize || !asset.afterSize)) {
    back("/admin/website/gallery", "Publish a result only after consent and both photographs are saved.");
  }
  if (requested === "PUBLISHED" && !asset.beforeSize) back("/admin/website/gallery", "Add a photograph before publishing.");
  await prisma.galleryAsset.update({
    where: { id },
    data: {
      publicationStatus: requested,
      displayOrder: orderOf(formData.get("displayOrder")),
      consentRecorded: consent,
      consentNote: cleanLine(String(formData.get("consentNote") || ""), 240) || null,
    },
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "gallery.update", entityType: "GalleryAsset", entityId: id, summary: `Updated gallery item ${asset.title}` } });
  revalidatePath("/gallery");
  revalidatePath("/");
  back("/admin/website/gallery");
}

export async function deleteGalleryAsset(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const id = String(formData.get("id") || "");
  if (formData.get("confirm") !== "yes") back("/admin/website/gallery", "Confirm before deleting a photograph.");
  await prisma.galleryAsset.delete({ where: { id } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "gallery.delete", entityType: "GalleryAsset", entityId: id, summary: "Deleted a gallery photograph" } });
  revalidatePath("/gallery");
  back("/admin/website/gallery");
}

export async function saveTestimonial(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const quote = cleanMultiline(String(formData.get("quote") || ""), 800);
  const authorName = cleanLine(String(formData.get("authorName") || ""), 80);
  const kind = String(formData.get("kind") || "CLIENT");
  if (quote.length < 8 || authorName.length < 2) back("/admin/website/testimonials", "Enter the quote and the person's name.");
  if (kind !== "CLIENT" && kind !== "STUDENT") back("/admin/website/testimonials", "Choose client or student.");
  const consentNote = cleanLine(String(formData.get("consentNote") || ""), 240);
  const requested = publication(String(formData.get("publicationStatus") || "DRAFT"));
  if (requested === "PUBLISHED" && consentNote.length < 4) back("/admin/website/testimonials", "Record how consent was given before publishing.");
  const row = await prisma.testimonial.create({
    data: {
      kind: kind as TestimonialKind,
      quote,
      authorName,
      roleLabel: cleanLine(String(formData.get("roleLabel") || ""), 80) || null,
      consentNote: consentNote || null,
      publicationStatus: requested,
      displayOrder: orderOf(formData.get("displayOrder")),
    },
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "testimonial.create", entityType: "Testimonial", entityId: row.id, summary: `Saved a testimonial from ${authorName}` } });
  revalidatePath("/");
  revalidatePath("/testimonials");
  back("/admin/website/testimonials");
}

export async function updateTestimonial(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const id = String(formData.get("id") || "");
  const row = await prisma.testimonial.findUnique({ where: { id } });
  if (!row) back("/admin/website/testimonials", "That testimonial was not found.");
  const requested = publication(String(formData.get("publicationStatus") || "DRAFT"));
  const consentNote = cleanLine(String(formData.get("consentNote") || row.consentNote || ""), 240);
  if (requested === "PUBLISHED" && consentNote.length < 4) back("/admin/website/testimonials", "Record consent before publishing.");
  await prisma.testimonial.update({ where: { id }, data: { publicationStatus: requested, displayOrder: orderOf(formData.get("displayOrder")), consentNote } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "testimonial.update", entityType: "Testimonial", entityId: id, summary: `Updated testimonial from ${row.authorName}` } });
  revalidatePath("/");
  revalidatePath("/testimonials");
  back("/admin/website/testimonials");
}

export async function deleteTestimonial(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const id = String(formData.get("id") || "");
  if (formData.get("confirm") !== "yes") back("/admin/website/testimonials", "Confirm before deleting a testimonial.");
  await prisma.testimonial.delete({ where: { id } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "testimonial.delete", entityType: "Testimonial", entityId: id, summary: "Deleted a testimonial" } });
  revalidatePath("/");
  revalidatePath("/testimonials");
  back("/admin/website/testimonials");
}

export async function saveFaq(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const question = cleanLine(String(formData.get("question") || ""), 180);
  const answer = cleanMultiline(String(formData.get("answer") || ""), 1200);
  const scope = cleanLine(String(formData.get("scope") || "courses"), 40).toLowerCase() || "courses";
  if (question.length < 4 || answer.length < 4) back("/admin/website/faqs", "Enter a question and an answer.");
  const row = await prisma.websiteFaq.create({
    data: { scope, question, answer, displayOrder: orderOf(formData.get("displayOrder")), publicationStatus: publication(String(formData.get("publicationStatus") || "DRAFT")) },
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "faq.create", entityType: "WebsiteFaq", entityId: row.id, summary: `Added FAQ: ${question}` } });
  revalidatePath("/courses");
  back("/admin/website/faqs");
}

export async function updateFaq(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const id = String(formData.get("id") || "");
  const row = await prisma.websiteFaq.findUnique({ where: { id } });
  if (!row) back("/admin/website/faqs", "That question was not found.");
  await prisma.websiteFaq.update({
    where: { id },
    data: {
      question: cleanLine(String(formData.get("question") || row.question), 180),
      answer: cleanMultiline(String(formData.get("answer") || row.answer), 1200),
      displayOrder: orderOf(formData.get("displayOrder")),
      publicationStatus: publication(String(formData.get("publicationStatus") || row.publicationStatus)),
    },
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "faq.update", entityType: "WebsiteFaq", entityId: id, summary: "Updated a website question" } });
  revalidatePath("/courses");
  back("/admin/website/faqs");
}

export async function deleteFaq(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const id = String(formData.get("id") || "");
  if (formData.get("confirm") !== "yes") back("/admin/website/faqs", "Confirm before deleting a question.");
  await prisma.websiteFaq.delete({ where: { id } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "faq.delete", entityType: "WebsiteFaq", entityId: id, summary: "Deleted a website question" } });
  revalidatePath("/courses");
  back("/admin/website/faqs");
}

export async function saveServiceContent(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const id = String(formData.get("id") || "");
  const content = await prisma.serviceContent.findUnique({ where: { id } });
  if (!content) back("/admin/website/services", "That service page was not found.");
  const serviceId = String(formData.get("serviceId") || "");
  const headline = cleanLine(String(formData.get("headline") || ""), 120);
  const category = cleanLine(String(formData.get("category") || ""), 80);
  const summary = cleanMultiline(String(formData.get("summary") || ""), 400);
  if (headline.length < 2 || summary.length < 4) back(`/admin/website/services?id=${id}`, "Enter a headline and a short summary.");
  if (serviceId) {
    const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } });
    if (!service) back(`/admin/website/services?id=${id}`, "Choose a booking service that already exists.");
  }
  const faqLines = String(formData.get("faqs") || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const faqs = faqLines.flatMap((line) => {
    const [question, answer] = line.split("|").map((part) => part?.trim() || "");
    return question && answer ? [{ question: question.slice(0, 180), answer: answer.slice(0, 600) }] : [];
  });
  try {
    await prisma.serviceContent.update({
      where: { id },
      data: {
        headline,
        category: category || content.category,
        summary,
        longDescription: cleanMultiline(String(formData.get("longDescription") || ""), 4000),
        benefits: cleanMultiline(String(formData.get("benefits") || ""), 2000),
        preparation: cleanMultiline(String(formData.get("preparation") || ""), 2000),
        aftercare: cleanMultiline(String(formData.get("aftercare") || ""), 2000),
        faqs,
        featured: formData.get("featured") === "yes",
        displayOrder: orderOf(formData.get("displayOrder")),
        publicationStatus: publication(String(formData.get("publicationStatus") || "DRAFT")),
        serviceId: serviceId || null,
      },
    });
  } catch {
    back(`/admin/website/services?id=${id}`, "That booking service is already linked to another page.");
  }
  await prisma.auditLog.create({ data: { actorId: user.id, action: "serviceContent.update", entityType: "ServiceContent", entityId: id, summary: `Updated service page ${headline}` } });
  revalidatePath("/services");
  revalidatePath("/");
  back(`/admin/website/services?id=${id}`);
}
