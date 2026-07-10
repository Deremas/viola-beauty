import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Banknote, CalendarCheck, Clock, CopyCheck, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { getSiteUrl, siteDescription, siteName } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beauty Appointment Booking",
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${siteName} | Beauty Appointment Booking`,
    description: siteDescription,
    url: "/",
  },
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function HomePage() {
  const currentYear = new Date().getFullYear();
  const siteUrl = getSiteUrl();
  const [services, bankAccounts, workingHours] = await Promise.all([
    prisma.service.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.bankAccount.findMany({ where: { isActive: true }, orderBy: { bankName: "asc" }, take: 3 }),
    prisma.workingHour.findMany({ where: { isOpen: true }, orderBy: { dayOfWeek: "asc" } }),
  ]);

  const lowestAdvance = services.length > 0 ? Math.min(...services.map((service) => Number(service.advanceAmount))) : null;
  const openDays = summarizeOpenDays(workingHours);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    areaServed: "Addis Ababa",
    priceRange: services.length > 0 ? `${money(Math.min(...services.map((service) => Number(service.price))))}+` : "ETB",
    openingHoursSpecification: workingHours.map((hour) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayNames[hour.dayOfWeek],
      opens: hour.openingTime,
      closes: hour.closingTime,
    })),
    makesOffer: services.map((service) => ({
      "@type": "Offer",
      name: service.name,
      price: Number(service.price),
      priceCurrency: "ETB",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        description: service.description || undefined,
        serviceType: service.category || "Beauty service",
      },
    })),
  };

  return (
    <main className="min-h-screen overflow-hidden">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
        <div className="absolute left-4 top-8 -z-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-12 right-8 -z-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-2 text-sm font-semibold text-primary shadow-soft">
            <Sparkles className="h-4 w-4" />
            Viola Brows and Beauty
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-5xl font-bold leading-[0.96] tracking-tight text-foreground md:text-7xl">
              Soft beauty work, planned without the back-and-forth.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Choose your service, pick an available time, transfer the required advance payment, and upload your proof.
              Viola reviews the payment and confirms your appointment.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/book">
                Book appointment
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#services">View services</Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <InfoPill icon={Clock} label="Open days" value={openDays} />
            <InfoPill icon={Banknote} label="Advance from" value={lowestAdvance === null ? "Set by service" : money(lowestAdvance)} />
            <InfoPill icon={ShieldCheck} label="Booking status" value="Confirmed after review" />
          </div>
        </div>

        <div className="rounded-[2rem] border bg-white/75 p-4 shadow-soft backdrop-blur">
          <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,hsl(var(--foreground)),hsl(32_34%_20%))] p-6 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
                <Heart className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-white/65">Client booking flow</p>
                <h2 className="font-display text-2xl font-bold">Simple, clear, confirmed.</h2>
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              {[
                ["1", "Choose a service", "Only active services from Viola are shown."],
                ["2", "Pick an open time", "Booked, break, and day-off times are hidden."],
                ["3", "Upload payment proof", "A clear transfer screenshot is required."],
                ["4", "Wait for confirmation", "Staff review payment before confirming."],
              ].map(([step, title, text]) => (
                <div key={step} className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-foreground">{step}</span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-white/70">{text}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Services</p>
            <h2 className="font-display text-4xl font-bold">Services you can book online</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/book">Check available times</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="bg-white/80">
              <CardContent className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {service.category || "Beauty service"}
                    </p>
                    <h3 className="mt-1 text-xl font-bold">{service.name}</h3>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {service.durationMinutes} min
                  </span>
                </div>
                {service.description ? (
                  <p className="min-h-12 text-sm leading-6 text-muted-foreground">{service.description}</p>
                ) : (
                  <p className="min-h-12 text-sm leading-6 text-muted-foreground">Details are available during booking.</p>
                )}
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/60 p-3">
                    <span className="block text-muted-foreground">Full price</span>
                    <strong>{money(service.price)}</strong>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-3">
                    <span className="block text-muted-foreground">Advance</span>
                    <strong>{money(service.advanceAmount)}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {services.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="p-6 text-muted-foreground">
                Online services are being prepared. Please check again soon.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-10 lg:grid-cols-3">
        <HelpCard
          icon={CalendarCheck}
          title="Only available slots show"
          text="The booking page hides times that are already booked, outside working hours, during breaks, or blocked by days off."
        />
        <HelpCard
          icon={CopyCheck}
          title="Easy payment details"
          text={
            bankAccounts.length > 0
              ? `${bankAccounts.length} active payment account${bankAccounts.length === 1 ? "" : "s"} available during booking, with copy buttons for account details.`
              : "Payment accounts will appear when Viola activates them from admin settings."
          }
        />
        <HelpCard
          icon={ShieldCheck}
          title="Reviewed before confirmation"
          text="Your request is saved with the uploaded proof, then staff verify the transfer and confirm the final booking."
        />
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-6">
        <div className="overflow-hidden rounded-[2rem] border bg-white/80 shadow-soft">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Ready to visit?</p>
              <h2 className="mt-2 font-display text-3xl font-bold">Send your booking request with payment proof.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                Pick your service and date first. The system will show only available times and guide you through payment proof upload.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/book">
                Start booking
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t bg-white/45 px-6 py-6 text-center text-sm text-muted-foreground">
        <span>&copy; {currentYear} Viola Brows and Beauty. Built by </span>
        <a
          href="https://blueoceancreatives.com/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Blue Ocean Creatives
        </a>
      </footer>
    </main>
  );
}

function InfoPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white/70 p-4 shadow-soft">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function HelpCard({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <Card className="bg-white/80">
      <CardContent className="p-6">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function summarizeOpenDays(hours: { dayOfWeek: number }[]) {
  if (hours.length === 0) return "Set by Viola";

  const days = hours.map((hour) => hour.dayOfWeek).sort((a, b) => a - b);
  const mondayToSaturday = [1, 2, 3, 4, 5, 6];
  if (mondayToSaturday.every((day) => days.includes(day)) && !days.includes(0)) return "Mon to Sat";
  if ([0, 1, 2, 3, 4, 5, 6].every((day) => days.includes(day))) return "Every day";

  return days.map((day) => dayNames[day].slice(0, 3)).join(", ");
}
