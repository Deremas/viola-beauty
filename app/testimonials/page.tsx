import { pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { readIfReady } from "@/lib/courses/db";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Testimonials",
  description: "Words from Viola Brows and Beauty clients and students. Quotes are published only after consent is saved.",
  path: "/testimonials",
});

export default async function TestimonialsPage() {
  const items = await readIfReady(
    () => prisma.testimonial.findMany({ where: { publicationStatus: "PUBLISHED" }, orderBy: { displayOrder: "asc" } }),
    [],
  );

  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Testimonials</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-brand-plum">Client and student words</h1>
        {items.length > 0 ? <p className="mt-4 leading-7 text-muted-foreground">Words from clients and students at Viola Brows and Beauty.</p> : null}
        <div className="mt-8 space-y-4">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={Math.min(index, 4) * 70}>
            <blockquote className="rounded-2xl border border-brand-line bg-white p-6 transition duration-200 hover:border-brand hover:shadow-soft">
              <p className="text-lg leading-8">“{item.quote}”</p>
              <footer className="mt-4 text-sm font-semibold text-brand-plum">{item.authorName}{item.roleLabel ? ` · ${item.roleLabel}` : ""}</footer>
            </blockquote>
            </Reveal>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
