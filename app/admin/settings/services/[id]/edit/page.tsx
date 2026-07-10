import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { updateServiceAndRedirect } from "../../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="outline">
        <Link href="/admin/settings/services">
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-5 rounded-lg border bg-background/70 p-4 text-sm text-muted-foreground">
            Current: {money(service.price)} price, {money(service.advanceAmount)} advance, {service.durationMinutes} min service time, {service.bufferMinutes} min gap between services.
          </div>

          <form action={updateServiceAndRedirect} className="grid gap-4">
            <input type="hidden" name="id" value={service.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service name">
                <Input name="name" defaultValue={service.name} required />
              </Field>
              <Field label="Category">
                <Input name="category" defaultValue={service.category || ""} placeholder="Optional category" />
              </Field>
            </div>
            <Field label="Client-facing description">
              <Textarea name="description" defaultValue={service.description || ""} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full price">
                <Input name="price" type="number" min="1" step="0.01" defaultValue={Number(service.price)} required />
              </Field>
              <Field label="Required advance payment">
                <Input name="advanceAmount" type="number" min="0" step="0.01" defaultValue={Number(service.advanceAmount)} required />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="How long the service takes">
                <Input name="durationMinutes" type="number" min="1" step="1" defaultValue={service.durationMinutes} required />
              </Field>
              <Field label="Gap between services">
                <Input name="bufferMinutes" type="number" min="0" step="1" defaultValue={service.bufferMinutes} />
                <p className="mt-1 text-xs text-muted-foreground">Extra minutes blocked before the next available slot.</p>
              </Field>
            </div>
            <Label className="flex items-center gap-2">
              <input name="isActive" type="checkbox" defaultChecked={service.isActive} /> Show this service to clients
            </Label>
            <Button type="submit">Save service changes</Button>
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
