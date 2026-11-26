import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { deleteFaq, saveFaq, updateFaq } from "../content-actions";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function FaqsAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("MANAGE_WEBSITE");
  const query = await searchParams;
  const items = await prisma.websiteFaq.findMany({ orderBy: [{ scope: "asc" }, { displayOrder: "asc" }] });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm"><Link href="/admin/website" className="font-semibold text-brand">Website</Link></p>
        <h1 className="font-display text-3xl font-bold">Questions</h1>
        <p className="text-sm text-muted-foreground">Published questions with the scope “courses” appear on the public courses page.</p>
      </div>
      {query.error ? <p className="rounded-lg border border-destructive/30 bg-white p-3 text-sm text-destructive" role="alert">{query.error}</p> : null}
      <form action={saveFaq} className="grid gap-3 rounded-lg border bg-white p-5">
        <Input name="scope" defaultValue="courses" aria-label="Scope" />
        <Input name="question" placeholder="Question" aria-label="Question" required />
        <Textarea name="answer" placeholder="Answer" required />
        <Input name="displayOrder" type="number" min={0} defaultValue={items.length + 1} aria-label="Display order" />
        <Select name="publicationStatus" defaultValue="PUBLISHED" aria-label="Publication"><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select>
        <div><Button type="submit">Add question</Button></div>
      </form>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border bg-white p-4">
          <form action={updateFaq} className="grid gap-3">
            <input type="hidden" name="id" value={item.id} />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.scope}</p>
            <Input name="question" defaultValue={item.question} aria-label="Question" />
            <Textarea name="answer" defaultValue={item.answer} aria-label="Answer" />
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="displayOrder" type="number" min={0} defaultValue={item.displayOrder} aria-label="Display order" />
              <Select name="publicationStatus" defaultValue={item.publicationStatus} aria-label="Publication"><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select>
            </div>
            <Button type="submit" size="sm">Save</Button>
          </form>
          <div className="mt-3"><ConfirmDeleteButton action={deleteFaq} id={item.id} name={item.question} description="This question is removed from the website." /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
