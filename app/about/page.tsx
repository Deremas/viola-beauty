import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { publicSite } from "@/lib/courses/site";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";
import { Button } from "@/components/ui/button";

const values = [
  {
    title: "Excellence",
    text: "We work to international standards, from technique and products to hygiene, in every service and every lesson.",
  },
  {
    title: "Precision",
    text: "Beauty is in the details. We take the time to get each one right.",
  },
  {
    title: "Care",
    text: "We put each client's comfort, safety and confidence first, before, during and after their treatment.",
  },
  {
    title: "Empowerment",
    text: "We teach skills that open doors, so women can support themselves and grow.",
  },
  {
    title: "Opportunity",
    text: "Through our monthly scholarship, we give back and make the industry open to women who couldn't otherwise afford to enter it.",
  },
  {
    title: "Integrity",
    text: "We give honest advice, charge transparent prices and keep our promises to clients and students.",
  },
];

export const metadata = pageMetadata({
  title: "About Viola Brows and Beauty",
  description: "Viola Brows and Beauty is a permanent makeup studio and beauty training institute in Addis Ababa, home of Viola Beauty Institute and a monthly scholarship.",
  path: "/about",
});

export default async function AboutPage() {
  const site = publicSite;
  return (
    <PublicShell>
      <main>
        <section className="bg-brand-plum text-white">
          <div className="viola-rise mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-pink">About Viola Brows & Beauty</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">Enhance Your Beauty. Master Your Craft.</h1>
          </div>
        </section>

        <Reveal>
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-14 text-lg leading-8 text-muted-foreground sm:px-6">
            <p>Viola Brows & Beauty is a beauty studio in Addis Ababa and the home of Viola Beauty Institute. We specialise in permanent makeup (PMU), including Nano Brows, Ombré Brows, Combo Brows and Lip Blushing. We also offer lashes, brow lamination, makeup, nails and waxing.</p>
            <p>Every treatment and course at Viola is led by an internationally trained and certified professional. You see it in the results: precise technique, strict hygiene, and care for every client from consultation to aftercare. That standard has built a community of more than 50,000 followers across our social media pages.</p>
            <p>The studio is at {site.addressLine}, {site.city}.</p>
          </div>
        </Reveal>

        <section className="bg-white">
          <Reveal>
            <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Viola Beauty Institute</p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-brand-plum">Viola is also a place to learn.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">Our hands-on PMU and beauty courses train individuals, especially women, in skills the industry needs so they can start careers and earn their own income. New classes start every month, and students learn the same techniques and standards we use in the studio.</p>
            </div>
          </Reveal>
        </section>

        <section className="bg-brand-soft">
          <Reveal>
            <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Our Monthly Scholarship</p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-brand-plum">One full scholarship, every month.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">Every month, Viola gives one woman a full scholarship to join our aesthetics courses at no cost. It&apos;s our way of opening the door to the beauty industry for someone who might not otherwise get the chance.</p>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto grid max-w-5xl gap-5 px-4 py-14 sm:px-6 md:grid-cols-2">
          <Reveal>
            <article className="h-full rounded-2xl border border-brand-line bg-white p-6">
              <h2 className="font-display text-3xl font-semibold text-brand-plum">Our Mission</h2>
              <p className="mt-4 leading-8 text-muted-foreground">To give every client quality, precision and care, and to train individuals with professional beauty skills that help them build independent, sustainable livelihoods.</p>
            </article>
          </Reveal>
          <Reveal delay={90}>
            <article className="h-full rounded-2xl border border-brand-line bg-white p-6">
              <h2 className="font-display text-3xl font-semibold text-brand-plum">Our Vision</h2>
              <p className="mt-4 leading-8 text-muted-foreground">To be Ethiopia&apos;s leading permanent makeup studio and beauty training institute, known for international standards and for the people we help build careers in the beauty industry.</p>
            </article>
          </Reveal>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Our Core Values</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-brand-plum">How we work</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((value, index) => (
                <Reveal key={value.title} delay={(index % 3) * 80} className="h-full">
                  <article className="h-full rounded-2xl border border-brand-line bg-brand-mist p-6">
                    <h3 className="font-display text-2xl font-semibold text-brand-plum">{value.title}</h3>
                    <p className="mt-3 leading-7 text-muted-foreground">{value.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full sm:w-auto"><Link href="/book">Book a Service</Link></Button>
              <Button asChild variant="outline" className="w-full sm:w-auto"><Link href="/courses">Explore Courses</Link></Button>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
