import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { deleteGalleryAsset, saveGalleryAsset, updateGalleryAsset } from "../content-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function GalleryAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("MANAGE_WEBSITE");
  const query = await searchParams;
  const items = await prisma.galleryAsset.findMany({
    orderBy: { displayOrder: "asc" },
    select: { id: true, title: true, altText: true, caption: true, kind: true, consentRecorded: true, consentNote: true, publicationStatus: true, displayOrder: true, beforeSize: true, afterSize: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm"><Link href="/admin/website" className="font-semibold text-brand">Website</Link></p>
        <h1 className="font-display text-3xl font-bold">Gallery</h1>
        <p className="text-sm text-muted-foreground">Studio and training photos can be published on their own. A result is published only as a before-and-after pair with consent recorded.</p>
      </div>
      {query.error ? <p className="rounded-lg border border-destructive/30 bg-white p-3 text-sm text-destructive" role="alert">{query.error}</p> : null}
      <form action={saveGalleryAsset} className="grid gap-3 rounded-lg border bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-semibold">Title<Input className="mt-2 font-normal" name="title" required /></label>
        <label className="text-sm font-semibold">Alt text<Input className="mt-2 font-normal" name="altText" required /></label>
        <label className="text-sm font-semibold">Type<Select className="mt-2 font-normal" name="kind" aria-label="Gallery type"><option value="STUDIO">Studio</option><option value="TRAINING">Training</option><option value="RESULT">Result pair</option></Select></label>
        <label className="text-sm font-semibold">Order<Input className="mt-2 font-normal" name="displayOrder" type="number" min={0} defaultValue={items.length + 1} /></label>
        <label className="text-sm font-semibold">Photograph<Input className="mt-2 font-normal" name="before" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
        <label className="text-sm font-semibold">After photograph<Input className="mt-2 font-normal" name="after" type="file" accept="image/jpeg,image/png,image/webp" /></label>
        <label className="text-sm font-semibold md:col-span-2">Caption<Textarea className="mt-2 font-normal" name="caption" /></label>
        <label className="text-sm font-semibold md:col-span-2">Consent note<Input className="mt-2 font-normal" name="consentNote" placeholder="How and when consent was recorded" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="consentRecorded" value="yes" /> Consent recorded for this person</label>
        <Select name="publicationStatus" defaultValue="DRAFT" aria-label="Publication"><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select>
        <div className="md:col-span-2"><Button type="submit">Add photograph</Button></div>
      </form>
      <div className="space-y-3">
        {items.map((item) => (
          <form key={item.id} action={updateGalleryAsset} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
            <input type="hidden" name="id" value={item.id} />
            <div className="md:col-span-4">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.kind} · {item.beforeSize ? "Photograph saved" : "Missing photograph"}{item.afterSize ? " · After saved" : ""}</p>
            </div>
            <Select name="publicationStatus" defaultValue={item.publicationStatus} aria-label={`Publication for ${item.title}`}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select>
            <Input name="displayOrder" type="number" min={0} defaultValue={item.displayOrder} aria-label={`Order for ${item.title}`} />
            <Input name="consentNote" defaultValue={item.consentNote || ""} aria-label={`Consent note for ${item.title}`} placeholder="Consent note" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="consentRecorded" value="yes" defaultChecked={item.consentRecorded} /> Consent recorded</label>
            <div className="flex flex-wrap gap-2 md:col-span-4">
              <Button type="submit" size="sm">Save</Button>
              <Button formAction={deleteGalleryAsset} size="sm" variant="outline" type="submit">Delete</Button>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" value="yes" /> Confirm delete</label>
            </div>
          </form>
        ))}
        {items.length === 0 ? <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No photographs yet.</p> : null}
      </div>
    </div>
  );
}
