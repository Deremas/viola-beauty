import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { publicSite } from "@/lib/courses/site";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";
import { Button } from "@/components/ui/button";

export const metadata = pageMetadata({
  title: "About the Studio",
  description: "Viola Brows and Beauty is a studio in Addis Ababa for professional beauty treatments and hands-on beauty training.",
  path: "/about",
});

export default async function AboutPage() {
  const site = publicSite;
  return (
    <PublicShell>
      <main>
        <section className="bg-brand-plum text-white">
          <div className="viola-rise mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-pink">About</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">Viola Brows and Beauty</h1>
          </div>
        </section>
        <Reveal>
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-lg leading-8 text-muted-foreground">{site.aboutText}</p>
        <p className="mt-4 leading-8 text-muted-foreground">The studio is at {site.addressLine}, {site.city}.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild><Link href="/book">Book a Service</Link></Button>
          <Button asChild variant="outline"><Link href="/courses">Explore Courses</Link></Button>
        </div>
        </div>
        </Reveal>
      </main>
    </PublicShell>
  );
}
