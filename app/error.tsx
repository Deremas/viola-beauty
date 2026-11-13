"use client";

import Link from "next/link";
import { PublicHeader } from "@/components/public/public-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";
import type { PublicSite } from "@/lib/courses/site";

const site: PublicSite = {
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

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Viola Brows and Beauty</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-brand-plum">The page is still here.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">A detail could not be loaded. You can keep browsing services, courses, and contact details.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" onClick={reset}>Try again</Button>
          <Button asChild variant="outline"><Link href="/services">Services</Link></Button>
          <Button asChild variant="outline"><Link href="/courses">Courses</Link></Button>
          <Button asChild variant="outline"><Link href="/contact">Contact</Link></Button>
        </div>
      </main>
      <SiteFooter site={site} />
    </>
  );
}
