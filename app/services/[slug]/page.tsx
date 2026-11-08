import { breadcrumbJsonLd, faqJsonLd, pageMetadata, siteName } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDuration } from "@/lib/format";
import { loadPublicService } from "@/lib/courses/load";
import { PublicShell } from "@/components/public/public-shell";
import { photoForService } from "@/lib/courses/photos";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const service = await loadPublicService((await params).slug);
  if (!service) return pageMetadata({ title: "Service", description: "A beauty service at Viola Brows and Beauty.", path: "/services" });
  return pageMetadata({
    title: service.name,
    description: service.summary,
    path: `/services/${service.slug}`,
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const service = await loadPublicService((await params).slug);
  if (!service) notFound();
  const faqData = faqJsonLd(service.faqs);
  return (
    <PublicShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
        { name: siteName, path: "/" },
        { name: "Beauty Services", path: "/services" },
        { name: service.name, path: `/services/${service.slug}` },
      ])) }} />
      {faqData ? <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} /> : null}
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] [&>*]:min-w-0">
        <article>
          <img alt={`${service.name} at Viola Brows and Beauty`} src={service.imageId ? `/api/public/services/${service.imageId}/image` : photoForService(service.slug)} width={960} height={720} decoding="async" className="aspect-[4/3] w-full rounded-[2rem] object-cover" />
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-brand">{service.category}</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-brand-plum">{service.name}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{service.longDescription}</p>
          <List title="Benefits" items={service.benefits} />
          <List title="Preparation" items={service.preparation} />
          <List title="Aftercare" items={service.aftercare} />
          {service.faqs.length > 0 ? <section className="mt-10"><h2 className="font-display text-3xl font-semibold">Questions</h2><div className="mt-4 space-y-3">{service.faqs.map((faq) => <details key={faq.question} className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">{faq.question}</summary><p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p></details>)}</div></section> : null}
        </article>
        <aside className="h-fit rounded-2xl border bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-3xl font-semibold">Book this service</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.priceLabel ? `${service.priceLabel}${service.advanceLabel ? ` · ${service.advanceLabel} advance` : ""}${service.durationMinutes ? ` · ${formatDuration(service.durationMinutes)}` : ""}` : "The price is confirmed on the booking page when this treatment is active on the calendar."}</p>
          <div className="mt-6 grid gap-3">
            <Button asChild><Link href={service.serviceId ? `/book?service=${service.serviceId}` : "/book"}>Book a service</Link></Button>
            {service.courseSlug ? <Button asChild variant="outline"><Link href={`/courses/${service.courseSlug}`}>View the course</Link></Button> : null}
          </div>
        </aside>
      </main>
    </PublicShell>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return <section className="mt-8"><h2 className="font-display text-3xl font-semibold">{title}</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}
