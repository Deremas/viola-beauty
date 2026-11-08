import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { brand, companyName } from "@/lib/brand";
import type { PublicSite } from "@/lib/courses/site";
import { BrandMark } from "@/components/public/brand-mark";
import { SocialLinks } from "@/components/public/social-links";

const linkClass = "text-sm text-white/85 underline-offset-4 transition-colors duration-150 hover:text-brand-pink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-pink";

export function SiteFooter({ site }: { site: PublicSite }) {
  const year = new Date().getFullYear();
  const socials = [
    site.instagram ? { href: site.instagram, label: "Instagram", icon: "instagram" as const } : null,
    site.facebook ? { href: site.facebook, label: "Facebook", icon: "facebook" as const } : null,
    site.tiktok ? { href: site.tiktok, label: "TikTok", icon: "tiktok" as const } : null,
  ].filter((item) => item !== null);

  return (
    <footer className="bg-brand-plum text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
        <div className="min-w-0">
          <Link href="/" aria-label={`${companyName} home`} className="inline-flex rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-pink">
            <BrandMark tone="light" compact />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-7 text-white/75">{site.footerText}</p>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-pink">Services</h2>
          <ul className="mt-4 space-y-3">
            <li><Link className={linkClass} href="/services#brows">Brow Treatments</Link></li>
            <li><Link className={linkClass} href="/services#lips">Lip Treatments</Link></li>
            <li><Link className={linkClass} href="/services#eyes">Makeup and Lashes</Link></li>
            <li><Link className={linkClass} href="/services#beauty">Nail and Wax</Link></li>
            <li><Link className={`${linkClass} font-semibold text-white`} href="/book">Book a Service</Link></li>
          </ul>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-pink">Courses</h2>
          <ul className="mt-4 space-y-3">
            <li><Link className={linkClass} href="/courses">All Courses</Link></li>
            <li><Link className={linkClass} href="/courses#register">Student Registration</Link></li>
            <li><Link className={linkClass} href="/gallery">Gallery</Link></li>
            <li><Link className={linkClass} href="/testimonials">Testimonials</Link></li>
            <li><Link className={linkClass} href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-pink">Get in Touch</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/85">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-pink" /><a className="min-w-0 break-words underline-offset-4 transition-colors duration-150 hover:text-brand-pink hover:underline" href={site.mapUrl} target="_blank" rel="noreferrer">{site.addressLine}, {site.city}</a></li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-pink" /><a className="underline-offset-4 transition-colors duration-150 hover:text-brand-pink hover:underline" href={`tel:${site.phonePrimary}`}>{site.phonePrimaryDisplay}</a></li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-pink" /><a className="underline-offset-4 transition-colors duration-150 hover:text-brand-pink hover:underline" href={`tel:${site.phoneSecondary}`}>{site.phoneSecondaryDisplay}</a></li>
            {site.email ? <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-pink" /><a className="break-all underline-offset-4 transition-colors duration-150 hover:text-brand-pink hover:underline" href={`mailto:${site.email}`}>{site.email}</a></li> : null}
          </ul>
          <SocialLinks items={socials} className="mt-5" />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-center text-sm text-white/70 sm:px-6 md:flex-row md:items-center md:justify-between md:text-left">
          <p>© {year} {companyName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/privacy" className={linkClass}>Privacy Policy</Link>
            <Link href="/terms" className={linkClass}>Terms</Link>
            <span>Built by <a className="font-semibold text-white underline-offset-4 transition-colors duration-150 hover:text-brand-pink hover:underline" href={brand.builderUrl} target="_blank" rel="noreferrer">{brand.builderName}</a></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
