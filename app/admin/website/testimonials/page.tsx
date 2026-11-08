import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { deleteTestimonial, saveTestimonial, updateTestimonial } from "../content-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function TestimonialsAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("MANAGE_WEBSITE");
  const query = await searchParams;
  const items = await prisma.testimonial.findMany({ orderBy: { displayOrder: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm"><Link href="/admin/website" className="font-semibold text-brand">Website</Link></p>
        <h1 className="font-display text-3xl font-bold">Testimonials</h1>
        <p className="text-sm text-muted-foreground">A quote stays hidden until consent is recorded and the status is published.</p>
      </div>
      {query.error ? <p className="rounded-lg border border-destructive/30 bg-white p-3 text-sm text-destructive" role="alert">{query.error}</p> : null}
      <form action={saveTestimonial} className="grid gap-3 rounded-lg border bg-white p-5">
        <Select name="kind" aria-label="Kind"><option value="CLIENT">Client</option><option value="STUDENT">Student</option></Select>
        <Textarea name="quote" placeholder="Quote, in the person's own words" required />
        <Input name="authorName" placeholder="Name" aria-label="Name" required />
        <Input name="roleLabel" placeholder="Optional label, such as the course name" aria-label="Label" />
        <Input name="consentNote" placeholder="How consent was recorded" aria-label="Consent note" />
        <Input name="displayOrder" type="number" min={0} defaultValue={items.length + 1} aria-label="Display order" />
        <Select name="publicationStatus" defaultValue="DRAFT" aria-label="Publication"><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select>
        <div><Button type="submit">Save testimonial</Button></div>
      </form>
      <div className="space-y-3">
        {items.map((item) => (
          <form key={item.id} action={updateTestimonial} className="space-y-3 rounded-lg border bg-white p-4">
            <input type="hidden" name="id" value={item.id} />
            <p className="text-sm font-semibold">{item.kind} · {item.authorName}</p>
            {item.quote ? <p className="text-sm leading-6">{item.quote}</p> : null}
            <div className="grid gap-3 md:grid-cols-3">
              <Select name="publicationStatus" defaultValue={item.publicationStatus} aria-label={`Publication for ${item.authorName}`}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select>
              <Input name="displayOrder" type="number" min={0} defaultValue={item.displayOrder} aria-label={`Order for ${item.authorName}`} />
              <Input name="consentNote" defaultValue={item.consentNote || ""} aria-label={`Consent for ${item.authorName}`} placeholder="Consent note" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" size="sm">Save</Button>
              <Button formAction={deleteTestimonial} size="sm" variant="outline" type="submit">Delete</Button>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" value="yes" /> Confirm delete</label>
            </div>
          </form>
        ))}
        {items.length === 0 ? <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No testimonials yet.</p> : null}
      </div>
    </div>
  );
}
