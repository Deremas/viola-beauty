"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

const maxPdfBytes = 15 * 1024 * 1024;

export async function uploadPrecautionDocument(formData: FormData) {
  const user = await requirePermission("MANAGE_SERVICES");
  const file = formData.get("document");
  const title = String(formData.get("title") || "Client Pre-Procedure Precautions").trim();

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a PDF before uploading. The current document was not changed");
  }
  if (file.type !== "application/pdf") throw new Error("Only PDF documents are accepted");
  if (file.size > maxPdfBytes) throw new Error("The PDF must be 15 MB or smaller");

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("The selected file is not a valid PDF");
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.precautionDocument.updateMany({ where: { isActive: true }, data: { isActive: false } });
    await tx.precautionDocument.create({
      data: {
        title: title || "Client Pre-Procedure Precautions",
        fileName: file.name || "client-precautions.pdf",
        contentType: "application/pdf",
        fileSize: file.size,
        fileData: bytes,
        isActive: true,
        activatedAt: now,
        uploadedByUserId: user.id,
      },
    });
  });

  revalidatePath("/admin/settings/precautions");
  revalidatePath("/precautions");
  revalidatePath("/book");
}

export async function activatePrecautionDocument(formData: FormData) {
  await requirePermission("MANAGE_SERVICES");
  const id = String(formData.get("id") || "");
  const document = await prisma.precautionDocument.findUnique({ where: { id }, select: { id: true } });
  if (!document) throw new Error("Precaution document not found");
  const now = new Date();

  await prisma.$transaction([
    prisma.precautionDocument.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } }),
    prisma.precautionDocument.update({ where: { id }, data: { isActive: true, activatedAt: now } }),
  ]);

  revalidatePath("/admin/settings/precautions");
  revalidatePath("/precautions");
  revalidatePath("/book");
}
