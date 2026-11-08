"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { brand } from "@/lib/brand";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { getBookingSlotInterval } from "@/lib/booking-settings";

function text(formData: FormData, name: string, fallback = "") {
  return String(formData.get(name) || fallback).trim();
}

function fail(code: string): never {
  redirect(`/admin/website?error=${code}`);
}

function phone(value: string) {
  const normalized = normalizeEthiopianPhone(value);
  if (!normalized) fail("phone");
  return `+${normalized}`;
}

function httpsOrEmpty(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") fail("social");
    return url.toString();
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    fail("social");
  }
}

function mapLink(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !/(^|\.)google\.[a-z.]+$|^maps\.app\.goo\.gl$/.test(url.hostname)) fail("map");
    return url.toString();
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    fail("map");
  }
}

function publishSite() {
  for (const path of ["/", "/contact", "/about", "/admin/website"]) revalidatePath(path);
}

export async function saveWebsiteSettings(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const email = text(formData, "contactEmail");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("email");
  const data = {
    heroTitle: text(formData, "heroTitle", brand.heroTitle),
    heroText: text(formData, "heroText", brand.heroText),
    aboutTitle: text(formData, "aboutTitle", brand.aboutTitle),
    aboutText: text(formData, "aboutText", brand.aboutText),
    addressLine: text(formData, "addressLine", brand.addressLine),
    city: text(formData, "city", brand.city),
    phonePrimary: phone(text(formData, "phonePrimary")),
    phoneSecondary: phone(text(formData, "phoneSecondary")),
    contactEmail: email || null,
    emailVerified: formData.get("emailVerified") === "yes" && Boolean(email),
    hoursNote: text(formData, "hoursNote") || null,
    instagramUrl: httpsOrEmpty(text(formData, "instagramUrl")),
    facebookUrl: httpsOrEmpty(text(formData, "facebookUrl")),
    tiktokUrl: httpsOrEmpty(text(formData, "tiktokUrl")),
    mapUrl: mapLink(text(formData, "mapUrl")),
    footerText: text(formData, "footerText", brand.footerText),
  };
  await prisma.siteSetting.upsert({ where: { id: "primary" }, create: { id: "primary", ...data }, update: data });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "website.update", entityType: "SiteSetting", entityId: "primary", summary: "Website contact details updated" } });
  publishSite();
  redirect("/admin/website?saved=details");
}

export async function saveStudioHours(formData: FormData) {
  const user = await requirePermission("MANAGE_WEBSITE");
  const interval = await getBookingSlotInterval();
  const rows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    openingTime: text(formData, `openingTime_${dayOfWeek}`, "09:00"),
    closingTime: text(formData, `closingTime_${dayOfWeek}`, "18:00"),
    isOpen: formData.get(`isOpen_${dayOfWeek}`) === "on",
  }));
  for (const row of rows.filter((item) => item.isOpen)) {
    if (!/^\d{2}:\d{2}$/.test(row.openingTime) || !/^\d{2}:\d{2}$/.test(row.closingTime) || row.openingTime >= row.closingTime) fail("hours");
    const minutes = [row.openingTime, row.closingTime].map((value) => Number(value.split(":")[1]));
    if (minutes.some((minute) => minute % interval !== 0)) fail("hours-step");
  }
  await prisma.$transaction(rows.map((row) => prisma.workingHour.upsert({ where: { dayOfWeek: row.dayOfWeek }, update: row, create: row })));
  await prisma.auditLog.create({ data: { actorId: user.id, action: "website.hours", entityType: "WorkingHour", entityId: "week", summary: "Studio hours updated from the website screen" } });
  revalidatePath("/contact");
  revalidatePath("/book");
  revalidatePath("/admin/website");
  revalidatePath("/admin/settings/availability");
  redirect("/admin/website?saved=hours");
}
