import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServiceAndRedirect } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreateServicePage() {
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
          <form action={createServiceAndRedirect} className="grid gap-4">
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
                <Input name="durationMinutes" type="number" min="1" step="1" placeholder="60" required />
              </Field>
              <Field label="Gap between services">
                <Input name="bufferMinutes" type="number" min="0" step="1" defaultValue="0" />
                <p className="mt-1 text-xs text-muted-foreground">Extra minutes blocked before the next available slot.</p>
              </Field>
            </div>
            <Label className="flex items-center gap-2">
              <input name="isActive" type="checkbox" defaultChecked /> Show this service to clients
            </Label>
            <Button type="submit">Create service</Button>
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
