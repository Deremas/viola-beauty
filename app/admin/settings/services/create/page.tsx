import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServiceAndRedirect } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { requirePermission } from "@/lib/permissions";

export default async function CreateServicePage() {
  await requirePermission("MANAGE_SERVICES");
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
          <CardTitle>Add service</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createServiceAndRedirect} encType="multipart/form-data" className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service name">
                <Input name="name" placeholder="Nano Brows" required />
              </Field>
              <Field label="Category">
                <Input name="category" placeholder="Brows, lashes, consultation..." />
              </Field>
            </div>
            <Field label="Client-facing description">
              <Textarea name="description" placeholder="Describe what the client receives." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full price">
                <Input name="price" type="number" min="1" step="0.01" placeholder="2500" required />
              </Field>
              <Field label="Required advance payment">
                <Input name="advanceAmount" type="number" min="0" step="0.01" placeholder="1000" required />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="How long the service takes">
                <div className="grid grid-cols-2 gap-3">
                  <div><Input name="durationHours" type="number" min="0" step="1" defaultValue="1" required /><p className="mt-1 text-xs text-muted-foreground">Hours</p></div>
                  <div><Select name="durationRemainderMinutes" defaultValue="0"><option value="0">0 minutes</option><option value="30">30 minutes</option></Select><p className="mt-1 text-xs text-muted-foreground">Extra minutes</p></div>
                </div>
              </Field>
              <Field label="Gap between services">
                <Input name="bufferMinutes" type="number" min="0" step="1" defaultValue="0" />
                <p className="mt-1 text-xs text-muted-foreground">Extra minutes blocked before the next available slot.</p>
              </Field>
            </div>
            <Field label="Service image optional">
              <Input name="serviceImage" type="file" accept="image/jpeg,image/png,image/webp" />
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WEBP, up to 5 MB. Services without an image still display normally.</p>
            </Field>
            <Label className="flex items-center gap-2">
              <input name="isActive" type="checkbox" defaultChecked /> Show this service to clients
            </Label>
            <div className="rounded-xl border bg-muted/30 p-5">
              <h2 className="font-display text-xl font-bold">Booking precaution pop-up</h2>
              <p className="mt-1 text-sm text-muted-foreground">Shown as a fixed message when a client selects this service. Enter one instruction per line.</p>
              <div className="mt-4 grid gap-4">
                <Field label="Pop-up service title"><Input name="bookingWarningTitle" placeholder="Nano Brows" /></Field>
                <Field label="Short preparation message"><Textarea name="bookingWarningIntro" placeholder="Explain why preparation matters for this service." /></Field>
                <Field label="Preparation instructions"><Textarea name="bookingWarningInstructions" className="min-h-32" placeholder={"First instruction\nSecond instruction\nThird instruction"} /></Field>
                <Field label="When the client must contact Viola"><Textarea name="bookingWarningContact" placeholder="List the warning conditions that require postponing or contacting Viola." /></Field>
                <Label className="flex items-center gap-2"><input name="bookingWarningActive" type="checkbox" /> Show this precaution pop-up to clients</Label>
              </div>
            </div>
            <div className="flex justify-end"><Button type="submit">Create service</Button></div>
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
