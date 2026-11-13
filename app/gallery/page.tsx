import { pageMetadata } from "@/lib/seo";
import { studioResults } from "@/lib/courses/results";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";
import Link from "next/link";

export const metadata = pageMetadata({
  title: "Gallery",
  description: "Before and after photographs from Viola Brows and Beauty.",
  path: "/gallery",
});

export default function GalleryPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Gallery</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-brand-plum">Studio and results</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Before and after from the studio.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {studioResults.map((result, index) => (
            <Reveal key={result.serviceSlug} delay={(index % 3) * 80} className="min-w-0">
              <Link href={`/services/${result.serviceSlug}`} className="group block overflow-hidden rounded-2xl border bg-white">
                <img src={result.image} alt={result.alt} width={960} height={960} loading="lazy" decoding="async" className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:transform-none" />
                <p className="px-4 py-3 font-semibold">{result.title}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
