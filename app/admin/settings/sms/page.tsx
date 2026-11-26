import { MessageSquareText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/db-safe";
import { requirePermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { saveSmsSettings, testSmsSettings } from "./actions";

export default async function SmsSettingsPage() {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const loaded = await withDb<{ ok: boolean; setting: Awaited<ReturnType<typeof prisma.smsSetting.findUnique>> }>(
    "sms-settings",
    async () => ({ ok: true, setting: await prisma.smsSetting.findUnique({ where: { id: "primary" } }) }),
    { ok: false, setting: null },
  );
  const setting = loaded.setting;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Settings</p>
        <h1 className="font-display text-3xl font-bold">Client SMS alerts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a confirmation message to the Ethiopian phone number entered by the client.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <Card>
          <CardHeader><CardTitle>AfroMessage connection</CardTitle></CardHeader>
          <CardContent>
            <form action={saveSmsSettings} className="grid gap-4">
              {!loaded.ok ? (
                <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-950">SMS settings could not be loaded. Nothing on this page was changed.</p>
              ) : null}
              <Field label="AfroMessage API key">
                <PasswordInput name="apiToken" autoComplete="off" required={!setting} placeholder={setting ? "Key saved - leave blank to keep it" : "Paste the AfroMessage API key"} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="AfroMessage account id">
                  <Input name="identifierId" defaultValue={setting?.identifierId || ""} placeholder="Your AfroMessage account id" required />
                </Field>
                <Field label="Sender name">
                  <Input name="senderName" defaultValue={setting?.senderName || ""} placeholder="Viola" required />
                </Field>
              </div>
              <Label className="flex items-center gap-2">
                <input name="isActive" type="checkbox" defaultChecked={setting?.isActive ?? true} />
                Send SMS alerts to clients
              </Label>

              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="font-semibold">When is SMS sent?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  One SMS is sent after staff confirms the client&apos;s payment and booking. It includes the appointment time, booking code, and a link to check the latest status on the Viola website.
                </p>
              </div>
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                The AfroMessage key is stored privately on the server. SMS delivery charges are billed by AfroMessage.
              </p>
              <div className="flex justify-end"><Button type="submit" pendingText="Saving SMS settings...">Save SMS settings</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Test the connection</CardTitle></CardHeader>
          <CardContent>
            <form action={testSmsSettings} className="grid gap-4">
              <Field label="Ethiopian mobile number">
                <Input name="phone" type="tel" placeholder="0912345678" required />
              </Field>
              <p className="text-sm text-muted-foreground">Both 091... and +25191... formats are accepted.</p>
              <div className="flex justify-end">
                <Button type="submit" variant="outline" pendingText="Sending test SMS...">
                  <MessageSquareText className="h-4 w-4" /> Send test SMS
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-2 block">{label}</Label>{children}</div>;
}
