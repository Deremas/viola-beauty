import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateClientAndRedirect } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function ClientEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const birthDate = client.birthDate ? client.birthDate.toISOString().slice(0, 10) : "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="outline">
        <Link href={`/admin/clients/${client.id}`}><ArrowLeft className="h-4 w-4" />Back to client</Link>
      </Button>

      <Card>
        <CardHeader><CardTitle>Edit client</CardTitle></CardHeader>
        <CardContent>
          <form action={updateClientAndRedirect} className="grid gap-4">
            <input type="hidden" name="id" value={client.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input name="fullName" defaultValue={client.fullName} required /></Field>
              <Field label="Main phone"><Input name="phone" defaultValue={client.phone} required /></Field>
              <Field label="Other phone"><Input name="alternatePhone" defaultValue={client.alternatePhone || ""} /></Field>
              <Field label="Email"><Input name="email" type="email" defaultValue={client.email || ""} /></Field>
              <Field label="Address"><Input name="address" defaultValue={client.address || ""} /></Field>
              <Field label="Birthday"><Input name="birthDate" type="date" defaultValue={birthDate} /></Field>
              <Field label="How they found us"><Input name="source" defaultValue={client.source || ""} placeholder="Instagram, referral, walk-in..." /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preferences"><Textarea name="preferences" defaultValue={client.preferences || ""} placeholder="Preferred style, color, artist, etc." /></Field>
              <Field label="Allergies / cautions"><Textarea name="allergies" defaultValue={client.allergies || ""} placeholder="Allergies, skin sensitivity, medical cautions." /></Field>
              <Field label="Client note"><Textarea name="note" defaultValue={client.note || ""} /></Field>
              <Field label="Private staff note"><Textarea name="internalNote" defaultValue={client.internalNote || ""} /></Field>
            </div>
            <Label className="flex items-center gap-2">
              <input name="isActive" type="checkbox" defaultChecked={client.isActive} /> Active client
            </Label>
            <Button type="submit">Save client</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}
