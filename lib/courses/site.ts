import { brand } from "@/lib/brand";
import { prisma } from "@/lib/prisma";
import { formatEthiopianPhone } from "@/lib/phone";
import { readIfReady } from "@/lib/courses/db";

export type PublicSite = {
  heroTitle: string;
  heroText: string;
  aboutTitle: string;
  aboutText: string;
  email: string | null;
  addressLine: string;
  city: string;
  phonePrimary: string;
  phoneSecondary: string;
  phonePrimaryDisplay: string;
  phoneSecondaryDisplay: string;
  hoursNote: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  mapUrl: string;
  footerText: string;
};

const defaults: PublicSite = {
  heroTitle: brand.heroTitle,
  heroText: brand.heroText,
  aboutTitle: brand.aboutTitle,
  aboutText: brand.aboutText,
  email: null,
  addressLine: brand.addressLine,
  city: brand.city,
  phonePrimary: brand.phonePrimary,
  phoneSecondary: brand.phoneSecondary,
  phonePrimaryDisplay: brand.phonePrimaryDisplay,
  phoneSecondaryDisplay: brand.phoneSecondaryDisplay,
  hoursNote: null,
  instagram: brand.instagram,
  facebook: brand.facebook,
  tiktok: brand.tiktok,
  mapUrl: brand.mapUrl,
  footerText: brand.footerText,
};

export async function getSiteContent(): Promise<PublicSite> {
  const row = await readIfReady(() => prisma.siteSetting.findUnique({ where: { id: "primary" } }), null);
  if (!row) return defaults;
  return {
    heroTitle: row.heroTitle || defaults.heroTitle,
    heroText: row.heroText || defaults.heroText,
    aboutTitle: row.aboutTitle || defaults.aboutTitle,
    aboutText: row.aboutText || defaults.aboutText,
    email: row.emailVerified && row.contactEmail ? row.contactEmail : null,
    addressLine: row.addressLine || defaults.addressLine,
    city: row.city || defaults.city,
    phonePrimary: row.phonePrimary || defaults.phonePrimary,
    phoneSecondary: row.phoneSecondary || defaults.phoneSecondary,
    phonePrimaryDisplay: formatEthiopianPhone(row.phonePrimary || defaults.phonePrimary),
    phoneSecondaryDisplay: formatEthiopianPhone(row.phoneSecondary || defaults.phoneSecondary),
    hoursNote: row.hoursNote,
    instagram: row.instagramUrl || null,
    facebook: row.facebookUrl || null,
    tiktok: row.tiktokUrl || null,
    mapUrl: row.mapUrl || defaults.mapUrl,
    footerText: row.footerText || defaults.footerText,
  };
}
