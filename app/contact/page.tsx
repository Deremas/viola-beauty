import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { brand, studioHours } from "@/lib/brand";
import { publicSite } from "@/lib/courses/site";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";
import { SocialLinks } from "@/components/public/social-links";
import { Button } from "@/components/ui/button";

export const metadata = pageMetadata({
  title: "Contact and Location",
  description: "Call or visit Viola Brows and Beauty at Summit Safari Fiyel Bet, Soreti Bldg 2nd Floor, Addis Ababa. Phone numbers and studio hours are listed on this page.",
  path: "/contact",
});

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const query = await searchParams;
  const site = publicSite;
  const socials = [
    site.instagram ? { href: site.instagram, label: "Instagram", icon: "instagram" as const } : null,
    site.facebook ? { href: site.facebook, label: "Facebook", icon: "facebook" as const } : null,
    site.tiktok ? { href: site.tiktok, label: "TikTok", icon: "tiktok" as const } : null,
  ].filter((item) => item !== null);
  return (
    <PublicShell>
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12 [&>*]:min-w-0">
          <Reveal>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Contact</p>
            <h1 className="mt-3 font-display text-5xl font-semibold text-brand-plum">Get in touch</h1>
            {query.service ? <p className="mt-4 rounded-xl bg-brand-soft p-4 text-sm">You asked about <strong>{query.service.replaceAll("-", " ")}</strong>. Call the studio and mention that service.</p> : null}
            <ul className="mt-8 space-y-5">
              <li className="flex gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand" />
                <a className="min-w-0 break-words text-lg leading-7 underline-offset-4 transition-colors duration-150 hover:text-brand hover:underline" href={site.mapUrl} target="_blank" rel="noreferrer">
                  {site.addressLine}
                  <span className="mt-1 block text-base text-muted-foreground">{site.city}</span>
                </a>
              </li>
              <PhoneRow display={site.phonePrimaryDisplay} phone={site.phonePrimary} />
              <PhoneRow display={site.phoneSecondaryDisplay} phone={site.phoneSecondary} />
              {site.email ? <li className="flex gap-3"><Mail className="mt-1 h-5 w-5 shrink-0 text-brand" /><a className="font-semibold text-brand underline-offset-4 hover:underline" href={`mailto:${site.email}`}>{site.email}</a></li> : null}
            </ul>
            <SocialLinks items={socials} className="mt-8" />
            {site.hoursNote ? <p className="mt-6 text-sm leading-6">{site.hoursNote}</p> : null}
          </div>
          </Reveal>
          <Reveal delay={90}>
          <div className="viola-card rounded-2xl border border-brand-line bg-white p-6">
            <h2 className="flex items-center gap-2 font-display text-3xl font-semibold"><Clock className="h-6 w-6 text-brand" />Studio hours</h2>
            <ul className="mt-5 space-y-1 text-sm">
              {studioHours.map((group) => <li key={group.days} className="flex justify-between gap-4 border-b border-brand-line py-3 last:border-b-0"><span>{group.days}</span><span className="font-semibold">{group.label}</span></li>)}
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/book">Book a Service</Link></Button>
            <Button asChild variant="outline"><Link href="/courses">View Courses</Link></Button>
          </div>
          </Reveal>
        </div>
        <Reveal>
          <div className="mt-12 max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-brand-plum">Find the studio</h2>
            <a href={site.mapUrl} target="_blank" rel="noreferrer" className="viola-card mt-4 block overflow-hidden rounded-2xl border border-brand-line bg-white">
              <iframe title="Viola Brows and Beauty on Google Maps" src={brand.mapEmbedUrl} className="pointer-events-none w-full border-0" style={{ height: "16rem" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" tabIndex={-1} />
              <span className="flex items-center justify-between gap-3 border-t border-brand-line px-4 py-3 text-sm">
                <span className="font-semibold text-brand-plum">Viola Brows and Beauty</span>
                <span className="font-semibold text-brand">Open in Google Maps</span>
              </span>
            </a>
          </div>
        </Reveal>
      </main>
    </PublicShell>
  );
}

function PhoneRow({ display, phone }: { display: string; phone: string }) {
  return (
    <li className="flex gap-3">
      <Phone className="mt-1 h-5 w-5 shrink-0 text-brand" />
      <a className="text-lg font-semibold underline-offset-4 transition-colors duration-150 hover:text-brand hover:underline" href={`tel:${phone}`}>{display}</a>
    </li>
  );
}
