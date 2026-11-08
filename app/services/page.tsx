import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { formatDuration } from "@/lib/format";
import { loadPublicServices } from "@/lib/courses/load";
import { serviceGroups } from "@/lib/courses/service-profiles";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";
import { photoForService } from "@/lib/courses/photos";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Beauty Services",
  description: "Browse brow, lip, eye, makeup, lash, nail, and waxing services at Viola Brows and Beauty. Book online when a price and time are published.",
  path: "/services",
});

export default async function ServicesPage() {
  const services = await loadPublicServices();
  return (
    <PublicShell>
      <main>
        <section className="bg-brand-plum text-white">
          <div className="viola-rise mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-pink">Services</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">Treatments you can read, and book when the calendar is open.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">Every treatment uses the same booking calendar. A price appears when that service is saved and active.</p>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {serviceGroups.map((group) => {
          const cards = services.filter((service) => service.group === group.id && service.displayOrder < 100);
          if (cards.length === 0) return null;
          return (
            <section key={group.id} id={group.id} className="mt-12 scroll-mt-24">
              <h2 className="font-display text-3xl font-semibold">{group.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{group.text}</p>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
                {cards.map((service, index) => (
                  <Reveal key={service.slug} delay={(index % 3) * 90} className="h-full min-w-0">
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-line bg-white transition duration-200 hover:border-brand hover:shadow-soft">
                    <div className="overflow-hidden">
                      <img src={service.imageId ? `/api/public/services/${service.imageId}/image` : photoForService(service.slug)} alt="" width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.04] motion-reduce:transform-none" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-3xl font-semibold">{service.name}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{service.summary}</p>
                      <p className="mt-4 text-sm font-semibold">{[service.priceLabel, service.durationMinutes ? formatDuration(service.durationMinutes) : null].filter(Boolean).join(" · ") || "Price set at the studio"}</p>
                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        <Button asChild variant="outline" className="h-11"><Link href={`/services/${service.slug}`}>View Details</Link></Button>
                        <Button asChild className="h-11"><Link href={service.serviceId ? `/book?service=${service.serviceId}` : "/book"}>Book a service</Link></Button>
                      </div>
                    </div>
                  </article>
                  </Reveal>
                ))}
              </div>
            </section>
          );
        })}
        </div>
      </main>
    </PublicShell>
  );
}
