import type { ReactNode } from "react";
import { Send, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { TelegramNotificationChoices } from "@/components/admin/telegram-notification-choices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTelegramRecipient,
  deleteTelegramRecipient,
  saveTelegramBot,
  testTelegramRecipient,
  updateTelegramRecipient,
} from "./actions";

export default async function TelegramSettingsPage() {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const [setting, recipients] = await Promise.all([
    prisma.telegramBotSetting.findUnique({ where: { id: "primary" } }),
    prisma.telegramRecipient.findMany({
      include: { subscriptions: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Settings</p>
        <h1 className="font-display text-3xl font-bold">Telegram alerts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect one business bot, add notification recipients, and choose what each person receives.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Business Telegram bot</CardTitle></CardHeader>
          <CardContent>
            <form action={saveTelegramBot} className="grid gap-4">
              <Field label="Bot token">
                <Input
                  name="botToken"
                  type="password"
                  autoComplete="off"
                  placeholder={setting ? "Token saved - leave blank to keep it" : "Paste token from BotFather"}
                  required={!setting}
                />
              </Field>
              <Field label="Bot username optional">
                <Input name="botUsername" defaultValue={setting?.botUsername || ""} placeholder="ViolaBookingBot" />
              </Field>
              <Label className="flex items-center gap-2">
                <input name="isActive" type="checkbox" defaultChecked={setting?.isActive ?? true} />
                Send Telegram notifications
              </Label>
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                The token is encrypted using AUTH_SECRET before it is saved. Create the bot with @BotFather, then ask every recipient to start the bot once.
              </p>
              <div className="flex justify-end"><Button type="submit">Save Telegram bot</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Add notification recipient</CardTitle></CardHeader>
          <CardContent>
            <form action={createTelegramRecipient} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Recipient name"><Input name="name" placeholder="Viola Admin" required /></Field>
                <Field label="Telegram chat ID"><Input name="chatId" placeholder="123456789" required /></Field>
              </div>
              <Field label="Telegram username or personal ID optional">
                <Input name="personalId" placeholder="@username or Telegram user ID" />
              </Field>
              <TelegramNotificationChoices />
              <Label className="flex items-center gap-2">
                <input name="isActive" type="checkbox" defaultChecked /> Recipient is active
              </Label>
              <div className="flex justify-end"><Button type="submit">Add Telegram recipient</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Notification recipients</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Telegram recipients have been added yet.</p>
          ) : null}
          {recipients.map((recipient) => {
            const selected = new Set(recipient.subscriptions.map((subscription) => subscription.event));
            return (
              <div key={recipient.id} className="rounded-lg border bg-white p-4 shadow-soft">
                <form action={updateTelegramRecipient} className="grid gap-4">
                  <input type="hidden" name="id" value={recipient.id} />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Recipient name"><Input name="name" defaultValue={recipient.name} required /></Field>
                    <Field label="Telegram chat ID"><Input name="chatId" defaultValue={recipient.chatId} required /></Field>
                    <Field label="Username or personal ID"><Input name="personalId" defaultValue={recipient.personalId || ""} /></Field>
                  </div>
                  <TelegramNotificationChoices selected={[...selected]} />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Label className="flex items-center gap-2">
                      <input name="isActive" type="checkbox" defaultChecked={recipient.isActive} /> Recipient is active
                    </Label>
                    <Button type="submit" variant="outline">Save recipient preferences</Button>
                  </div>
                </form>
                <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                  <form action={testTelegramRecipient}>
                    <input type="hidden" name="id" value={recipient.id} />
                    <Button type="submit" variant="outline"><Send className="h-4 w-4" />Send test notification</Button>
                  </form>
                  <form action={deleteTelegramRecipient}>
                    <input type="hidden" name="id" value={recipient.id} />
                    <Button type="submit" variant="destructive"><Trash2 className="h-4 w-4" />Delete recipient</Button>
                  </form>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><Label className="mb-2 block">{label}</Label>{children}</div>;
}
