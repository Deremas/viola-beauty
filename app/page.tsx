import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock, GraduationCap, Mail, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { companyName } from "@/lib/brand";
import { getSiteUrl, pageMetadata, siteDescription, siteName } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { readIfReady } from "@/lib/courses/db";
import { getSiteContent } from "@/lib/courses/site";
import { loadPublicCourses, loadPublicServices } from "@/lib/courses/load";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";
import { coursePhotos, courseStudioPhoto, photoForService } from "@/lib/courses/photos";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: `${siteName} | Beauty Services and Courses in Addis Ababa`,
  description: siteDescription,
  path: "/",
  absolute: true,
});

export default async function HomePage() {
  const site = await getSiteContent();
  const [services, courses, testimonials] = await Promise.all([
    loadPublicServices(),
    loadPublicCourses(),
    readIfReady(() => prisma.testimonial.findMany({ where: { publicationStatus: "PUBLISHED" }, orderBy: { displayOrder: "asc" }, take: 3, select: { id: true, quote: true, authorName: true } }), []),
  ]);
  const featuredServices = services.filter((service) => service.featured).slice(0, 3);
  const featuredCourses = courses.filter((course) => course.featured).slice(0, 3);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: siteName,
    url: getSiteUrl(),
    description: siteDescription,
    telephone: [site.phonePrimary, site.phoneSecondary],
    address: { "@type": "PostalAddress", streetAddress: site.addressLine, addressLocality: "Addis Ababa", addressCountry: "ET" },
    hasMap: site.mapUrl,
    image: `${getSiteUrl()}/brand/og.png`,
    logo: `${getSiteUrl()}/brand/viola-logo.png`,
    sameAs: [site.instagram, site.facebook, site.tiktok].filter(Boolean),
  };

  return (
    <PublicShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <main>
        <section className="bg-brand-plum text-white">
          <div className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-20">
            <div className="viola-rise min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-pink">{companyName}</p>
              <h1 className="mt-4 max-w-xl font-display text-5xl font-semibold leading-[0.95] sm:text-7xl">{site.heroTitle}</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">{site.heroText}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg" className="w-full bg-white text-brand-plum hover:bg-brand-soft sm:w-auto"><Link href="/book">Book a Service<ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline" className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"><Link href="/courses">Explore Courses</Link></Button>
              </div>
            </div>
            <img src={courseStudioPhoto} alt="Viola Brows and Beauty studio" className="min-h-[420px] w-full rounded-[2rem] object-cover" />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">About</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-brand-plum sm:text-5xl">{site.aboutTitle}</h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-muted-foreground">{site.aboutText}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 [&>*]:min-w-0">
              <Fact icon={MapPin} label="Studio" value={`${site.addressLine}`} />
              <Fact icon={Clock} label="Working hours" value="Monday to Saturday · By appointment" />
              <Fact icon={ShieldCheck} label="Bookings" value="Confirmed after payment review" />
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Services</p>
                <h2 className="mt-3 font-display text-4xl font-semibold text-brand-plum">Featured beauty services</h2>
              </div>
              <Button asChild variant="outline"><Link href="/services">View all services</Link></Button>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
              {featuredServices.map((service, index) => (
                <Reveal key={service.slug} delay={(index % 3) * 90} className="h-full min-w-0">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-line bg-brand-mist transition duration-200 hover:shadow-soft motion-reduce:transform-none">
                  <div className="overflow-hidden">
                    <img src={service.imageId ? `/api/public/services/${service.imageId}/image` : photoForService(service.slug)} alt="" width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.04] motion-reduce:transform-none" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{service.category}</p>
                    <h3 className="mt-2 font-display text-3xl font-semibold">{service.name}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{service.summary}</p>
                    <p className="mt-4 text-sm font-semibold">{[service.priceLabel, service.durationMinutes ? formatDuration(service.durationMinutes) : null].filter(Boolean).join(" · ") || "Price set at the studio"}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm"><Link href={`/services/${service.slug}`}>View Details</Link></Button>
                      <Button asChild size="sm"><Link href={service.serviceId ? `/book?service=${service.serviceId}` : "/book"}>Book a service</Link></Button>
                    </div>
                  </div>
                </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 [&>*]:min-w-0">
          <Reveal>
          <img src={courseStudioPhoto} alt="Viola studio treatment room" className="min-h-[360px] w-full rounded-[2rem] object-cover" />
          </Reveal>
          <Reveal delay={90}>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Courses</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-brand-plum sm:text-5xl">Practical beauty courses in the studio</h2>
            <p className="mt-5 leading-8 text-muted-foreground">Choose a course, read the draft curriculum, and send a registration request. Viola reviews the request before a fee, seat, or start date is confirmed.</p>
            <Button asChild className="mt-6"><Link href="/courses">Explore Courses<GraduationCap className="h-4 w-4" /></Link></Button>
          </Reveal>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-4xl font-semibold text-brand-plum">Featured courses</h2>
              <Button asChild variant="outline"><Link href="/courses">View all courses</Link></Button>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
              {featuredCourses.map((course, index) => (
                <Reveal key={course.slug} delay={(index % 3) * 90} className="h-full min-w-0">
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-line bg-white transition duration-200 hover:-translate-y-1 hover:border-brand hover:shadow-soft motion-reduce:transform-none">
                  <img src={coursePhotos[course.slug] || courseStudioPhoto} alt="" width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                  <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{course.category}</p>
                  <h3 className="mt-3 font-display text-3xl font-semibold">{course.name}</h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{course.shortDescription}</p>
                  <p className="mt-4 text-sm font-semibold">{course.skillLevel === "BEGINNER" ? "Beginner" : course.skillLevel === "INTERMEDIATE" ? "Intermediate" : "Advanced"}{course.feeLabel ? ` · ${course.feeLabel}` : ""}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm"><Link href={`/courses/${course.slug}`}>View Details</Link></Button>
                    {course.registrationOpen ? <Button asChild size="sm"><Link href={`/courses/${course.slug}/register`}>Register Now</Link></Button> : null}
                  </div>
                  </div>
                </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-4xl font-semibold text-brand-plum">Why choose Viola</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Reveal className="h-full"><Reason icon={Sparkles} title="Services and courses together" text="Book a treatment or request a course without mixing the two workflows." /></Reveal>
            <Reveal delay={90} className="h-full"><Reason icon={ShieldCheck} title="Reviewed before it is confirmed" text="Service appointments are confirmed after payment review. Course registration stays a request until staff approve it." /></Reveal>
            <Reveal delay={180} className="h-full"><Reason icon={MapPin} title="One studio in Addis Ababa" text={`${site.addressLine}, ${site.city}. Call ${site.phonePrimaryDisplay} or ${site.phoneSecondaryDisplay}.`} /></Reveal>
          </div>
        </section>

        <section className="bg-brand-soft py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-4xl font-semibold text-brand-plum">Real results</h2>
            <img src={courseStudioPhoto} alt="Treatment room at Viola Brows and Beauty" width={1200} height={525} loading="lazy" decoding="async" className="mt-6 aspect-[16/7] w-full max-w-3xl rounded-2xl object-cover" />
            <Button asChild variant="outline" className="mt-6"><Link href="/gallery">Open gallery</Link></Button>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-4xl font-semibold text-brand-plum">Client and student words</h2>
          {testimonials.length === 0 ? null : (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((item, index) => (
                <Reveal key={item.id} delay={(index % 3) * 90} className="h-full">
                <blockquote className="h-full rounded-2xl border border-brand-line bg-white p-5 shadow-soft transition duration-200 hover:border-brand hover:shadow-soft">
                  <p className="leading-7">“{item.quote}”</p>
                  <footer className="mt-4 text-sm font-semibold text-brand-plum">{item.authorName}</footer>
                </blockquote>
                </Reveal>
              ))}
            </div>
          )}
          <Button asChild variant="outline" className="mt-6"><Link href="/testimonials">Read testimonials</Link></Button>
        </section>

        <section className="bg-white">
          <Reveal>
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 [&>*]:min-w-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Visit</p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-brand-plum">Contact and location</h2>
              <ul className="mt-6 space-y-4">
                <li className="flex gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand" />
                  <a className="min-w-0 break-words text-lg leading-7 underline-offset-4 transition-colors duration-150 hover:text-brand hover:underline" href={site.mapUrl} target="_blank" rel="noreferrer">
                    {site.addressLine}
                    <span className="mt-1 block text-base text-muted-foreground">{site.city}</span>
                  </a>
                </li>
                <li className="flex gap-3"><Phone className="mt-1 h-5 w-5 shrink-0 text-brand" /><a className="font-semibold text-brand" href={`tel:${site.phonePrimary}`}>{site.phonePrimaryDisplay}</a></li>
                <li className="flex gap-3"><Phone className="mt-1 h-5 w-5 shrink-0 text-brand" /><a className="font-semibold text-brand" href={`tel:${site.phoneSecondary}`}>{site.phoneSecondaryDisplay}</a></li>
                {site.email ? <li className="flex gap-3"><Mail className="mt-1 h-5 w-5 shrink-0 text-brand" /><a className="font-semibold text-brand" href={`mailto:${site.email}`}>{site.email}</a></li> : null}
              </ul>
            </div>
            <div className="min-w-0 rounded-[2rem] bg-brand-plum p-5 text-white sm:p-8">
              <h2 className="font-display text-4xl font-semibold">Ready when you are.</h2>
              <p className="mt-4 leading-7 text-white/75">{services.filter((service) => service.serviceId).length} services can be requested online today. Course fees stay hidden until Viola publishes them.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild className="w-full bg-white text-brand-plum hover:bg-brand-soft sm:w-auto"><Link href="/book">Book a Service</Link></Button>
                <Button asChild variant="outline" className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"><Link href="/courses#register">Register for a Course</Link></Button>
              </div>
            </div>
          </div>
          </Reveal>
        </section>
      </main>
    </PublicShell>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="viola-card rounded-2xl border border-brand-line bg-white p-4"><Icon className="h-5 w-5 text-brand" /><p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}

function Reason({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return <article className="viola-card h-full rounded-2xl border border-brand-line bg-white p-6"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Icon className="h-6 w-6" /></span><h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-muted-foreground">{text}</p></article>;
}

