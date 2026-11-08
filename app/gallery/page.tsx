import { pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { readIfReady } from "@/lib/courses/db";
import { courseStudioPhoto } from "@/lib/courses/photos";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Gallery",
  description: "Studio photographs from Viola Brows and Beauty. Result pairs are published only when Viola has recorded consent and saved both photographs.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const items = await readIfReady(
    () => prisma.galleryAsset.findMany({ where: { publicationStatus: "PUBLISHED" }, orderBy: { displayOrder: "asc" } }),
    [],
  );
  const visible = items.filter((item) => item.kind !== "RESULT" || (item.consentRecorded && item.beforeData && item.afterData));
  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Gallery</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-brand-plum">Studio and results</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Studio work and client results from Viola Brows and Beauty.</p>
        {visible.length === 0 ? <img src={courseStudioPhoto} alt="Viola Brows and Beauty studio" width={1200} height={800} decoding="async" className="mt-10 aspect-[16/9] w-full rounded-2xl object-cover" /> : null}
        <div className="mt-8 grid gap-5 md:grid-cols-2 [&>*]:min-w-0">
          {visible.map((item, index) => (
            <Reveal key={item.id} delay={(index % 2) * 90} className="min-w-0">
            <figure className="group overflow-hidden rounded-2xl border bg-white transition duration-200 hover:shadow-soft">
              {item.kind === "RESULT" ? (
                <div className="grid sm:grid-cols-2">
                  <img src={`/api/public/gallery/${item.id}/before`} alt={`${item.altText} before`} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.04] motion-reduce:transform-none" />
                  <img src={`/api/public/gallery/${item.id}/after`} alt={`${item.altText} after`} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.04] motion-reduce:transform-none" />
                </div>
              ) : item.beforeData ? <img src={`/api/public/gallery/${item.id}/before`} alt={item.altText} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.04] motion-reduce:transform-none" /> : null}
              <figcaption className="p-4"><p className="font-semibold">{item.title}</p>{item.caption ? <p className="mt-1 text-sm text-muted-foreground">{item.caption}</p> : null}</figcaption>
            </figure>
            </Reveal>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
