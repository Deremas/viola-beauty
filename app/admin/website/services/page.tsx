import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { formatStatus } from "@/lib/format";
import { saveServiceContent } from "../content-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

function faqText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as { question?: unknown; answer?: unknown };
    return typeof record.question === "string" && typeof record.answer === "string" ? [`${record.question} | ${record.answer}`] : [];
  }).join("\n");
}

export default async function ServiceContentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("MANAGE_WEBSITE");
  const query = await searchParams;
  const [pages, services] = await Promise.all([
    prisma.serviceContent.findMany({ orderBy: { displayOrder: "asc" }, include: { service: { select: { id: true, name: true } } } }),
    prisma.service.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } }),
  ]);
  const selected = pages.find((page) => page.id === query.id) || null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm"><Link href="/admin/website" className="font-semibold text-brand">Website</Link></p>
        <h1 className="font-display text-3xl font-bold">Service pages</h1>
        <p className="text-sm text-muted-foreground">Link a public page to an existing booking service. Prices and appointment rules stay on the booking service itself.</p>
      </div>
      {query.error ? <p className="rounded-lg border border-destructive/30 bg-white p-3 text-sm text-destructive" role="alert">{query.error}</p> : null}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th className="p-3">Page</th><th>Booking service</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-t">
                <td className="p-3">{page.headline}<span className="block text-xs text-muted-foreground">{page.slug}</span></td>
                <td>{page.service?.name || "Not linked"}</td>
                <td>{formatStatus(page.publicationStatus)}{page.featured ? " · Featured" : ""}</td>
                <td className="p-3 text-right"><Button asChild size="sm" variant="outline"><Link href={`/admin/website/services?id=${page.id}`}>Edit</Link></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Service pages appear after the course catalog seed runs.</p> : null}
      </div>
      {selected ? (
        <form action={saveServiceContent} className="grid gap-4 rounded-lg border bg-white p-5">
          <h2 className="font-semibold">Edit {selected.headline}</h2>
          <input type="hidden" name="id" value={selected.id} />
          <label className="text-sm font-semibold">Headline<Input className="mt-2 font-normal" name="headline" defaultValue={selected.headline} /></label>
          <label className="text-sm font-semibold">Category<Input className="mt-2 font-normal" name="category" defaultValue={selected.category} /></label>
          <label className="text-sm font-semibold">Summary<Textarea className="mt-2 font-normal" name="summary" defaultValue={selected.summary} /></label>
          <label className="text-sm font-semibold">Full description<Textarea className="mt-2 font-normal" name="longDescription" defaultValue={selected.longDescription} /></label>
          <label className="text-sm font-semibold">Benefits, one per line<Textarea className="mt-2 font-normal" name="benefits" defaultValue={selected.benefits} /></label>
          <label className="text-sm font-semibold">Preparation, one per line<Textarea className="mt-2 font-normal" name="preparation" defaultValue={selected.preparation} /></label>
          <label className="text-sm font-semibold">Aftercare, one per line<Textarea className="mt-2 font-normal" name="aftercare" defaultValue={selected.aftercare} /></label>
          <label className="text-sm font-semibold">Questions, one per line as question | answer<Textarea className="mt-2 font-normal" name="faqs" defaultValue={faqText(selected.faqs)} /></label>
          <label className="text-sm font-semibold">Booking service
            <Select className="mt-2 font-normal" name="serviceId" defaultValue={selected.serviceId || ""} aria-label="Booking service">
              <option value="">Not linked</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}{service.isActive ? "" : " (inactive)"}</option>)}
            </Select>
          </label>
          <label className="text-sm font-semibold">Display order<Input className="mt-2 font-normal" name="displayOrder" type="number" min={0} defaultValue={selected.displayOrder} /></label>
          <label className="text-sm font-semibold">Publication<Select className="mt-2 font-normal" name="publicationStatus" defaultValue={selected.publicationStatus}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" value="yes" defaultChecked={selected.featured} /> Featured on the homepage</label>
          <div className="flex justify-end"><Button type="submit">Save service page</Button></div>
        </form>
      ) : null}
    </div>
  );
}
