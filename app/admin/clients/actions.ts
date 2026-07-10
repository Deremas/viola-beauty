"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function optionalDate(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text ? new Date(`${text}T00:00:00`) : null;
}

export async function updateClient(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));

  await prisma.client.update({
    where: { id },
    data: {
      fullName: String(formData.get("fullName") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      alternatePhone: optionalString(formData.get("alternatePhone")),
      email: optionalString(formData.get("email")),
      address: optionalString(formData.get("address")),
      birthDate: optionalDate(formData.get("birthDate")),
      source: optionalString(formData.get("source")),
      preferences: optionalString(formData.get("preferences")),
      allergies: optionalString(formData.get("allergies")),
      note: optionalString(formData.get("note")),
      internalNote: optionalString(formData.get("internalNote")),
      isActive: formData.get("isActive") === "on",
    },
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
}

export async function updateClientAndRedirect(formData: FormData) {
  const id = String(formData.get("id"));
  await updateClient(formData);
  redirect(`/admin/clients/${id}`);
}

export async function setClientActive(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const isActive = String(formData.get("isActive")) === "true";

  await prisma.client.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
}

export async function deleteClient(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));

  await prisma.client.delete({ where: { id } });

  revalidatePath("/admin/clients");
}
