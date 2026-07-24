import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { formatDuration, money } from "@/lib/format";
import { removeServiceImage, updateServiceAndRedirect } from "../../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("MANAGE_SERVICES");
  const { id } = await params;
  const service = await prisma.service.findFirst({
    where: { id, deletedAt: null },
    include: { image: { select: { fileName: true, fileSize: true } } },
  });
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
            Current: {money(service.price)} price, {money(service.advanceAmount)} advance, {formatDuration(service.durationMinutes)} service time, {service.bufferMinutes} min gap between services.
          </div>

          <form action={updateServiceAndRedirect} encType="multipart/form-data" className="grid gap-4">
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
                <div className="grid grid-cols-2 gap-3">
                  <div><Input name="durationHours" type="number" min="0" step="1" defaultValue={Math.floor(service.durationMinutes / 60)} required /><p className="mt-1 text-xs text-muted-foreground">Hours</p></div>
                  <div><Select name="durationRemainderMinutes" defaultValue={String(service.durationMinutes % 60)}><option value="0">0 minutes</option><option value="30">30 minutes</option></Select><p className="mt-1 text-xs text-muted-foreground">Extra minutes</p></div>
                </div>
              </Field>
              <Field label="Gap between services">
                <Input name="bufferMinutes" type="number" min="0" step="1" defaultValue={service.bufferMinutes} />
                <p className="mt-1 text-xs text-muted-foreground">Extra minutes blocked before the next available slot.</p>
              </Field>
            </div>
            <Field label="Replace service image optional">
              {service.image ? <div className="mb-3 flex items-center gap-4 rounded-xl border bg-muted/30 p-3"><Image unoptimized width={96} height={80} src={`/api/public/services/${service.id}/image`} alt="" className="h-20 w-24 rounded-lg object-cover" /><div><p className="font-semibold">{service.image.fileName}</p><p className="text-xs text-muted-foreground">{Math.ceil(service.image.fileSize / 1024)} KB</p></div></div> : <p className="mb-2 text-sm text-muted-foreground">No image uploaded.</p>}
              <Input name="serviceImage" type="file" accept="image/jpeg,image/png,image/webp" />
              <p className="mt-1 text-xs text-muted-foreground">Leave empty to keep the current image.</p>
            </Field>
            <Label className="flex items-center gap-2">
              <input name="isActive" type="checkbox" defaultChecked={service.isActive} /> Show this service to clients
            </Label>
            <div className="rounded-xl border bg-muted/30 p-5">
              <h2 className="font-display text-xl font-bold">Booking precaution pop-up</h2>
              <p className="mt-1 text-sm text-muted-foreground">Clients must acknowledge this fixed pop-up before continuing. Enter one instruction per line.</p>
              <div className="mt-4 grid gap-4">
                <Field label="Pop-up service title"><Input name="bookingWarningTitle" defaultValue={service.bookingWarningTitle || service.name} /></Field>
                <Field label="Short preparation message"><Textarea name="bookingWarningIntro" defaultValue={service.bookingWarningIntro || ""} /></Field>
                <Field label="Preparation instructions"><Textarea name="bookingWarningInstructions" className="min-h-32" defaultValue={service.bookingWarningInstructions || ""} /></Field>
                <Field label="When the client must contact Viola"><Textarea name="bookingWarningContact" defaultValue={service.bookingWarningContact || ""} /></Field>
                <Label className="flex items-center gap-2"><input name="bookingWarningActive" type="checkbox" defaultChecked={service.bookingWarningActive} /> Show this precaution pop-up to clients</Label>
              </div>
            </div>
            <div className="flex justify-end"><Button type="submit">Save service changes</Button></div>
          </form>
          {service.image ? <form action={removeServiceImage} className="mt-3 flex justify-end"><input type="hidden" name="id" value={service.id} /><Button type="submit" variant="destructive">Remove service image</Button></form> : null}
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
