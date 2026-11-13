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

export const publicSite: PublicSite = {
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
  try {
    const row = await readIfReady(() => prisma.siteSetting.findUnique({ where: { id: "primary" } }), null);
    if (!row) return publicSite;
    return {
      heroTitle: row.heroTitle || publicSite.heroTitle,
      heroText: row.heroText || publicSite.heroText,
      aboutTitle: row.aboutTitle || publicSite.aboutTitle,
      aboutText: row.aboutText || publicSite.aboutText,
      email: row.emailVerified && row.contactEmail ? row.contactEmail : null,
      addressLine: row.addressLine || publicSite.addressLine,
      city: row.city || publicSite.city,
      phonePrimary: row.phonePrimary || publicSite.phonePrimary,
      phoneSecondary: row.phoneSecondary || publicSite.phoneSecondary,
      phonePrimaryDisplay: formatEthiopianPhone(row.phonePrimary || publicSite.phonePrimary),
      phoneSecondaryDisplay: formatEthiopianPhone(row.phoneSecondary || publicSite.phoneSecondary),
      hoursNote: row.hoursNote,
      instagram: row.instagramUrl || null,
      facebook: row.facebookUrl || null,
      tiktok: row.tiktokUrl || null,
      mapUrl: row.mapUrl || publicSite.mapUrl,
      footerText: row.footerText || publicSite.footerText,
    };
  } catch {
    return publicSite;
  }
}
