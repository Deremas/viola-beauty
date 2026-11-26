import type { ReactNode } from "react";
import Link from "next/link";
import { Eye, ExternalLink, Pencil, Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { serverTelegramChatId } from "@/lib/telegram";
import { telegramEventValues, telegramEvents } from "@/lib/telegram-events";
import { telegramDestinationKind } from "@/lib/telegram-chat-id";
import { withDb } from "@/lib/db-safe";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { TelegramNotificationChoices } from "@/components/admin/telegram-notification-choices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Td, Th } from "@/components/ui/table";
import { createTelegramRecipient, deleteTelegramRecipient, testTelegramRecipient } from "./actions";

const userInfoBotUrl = "https://t.me/userinfobot";

export default async function TelegramSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  await requirePermission("MANAGE_NOTIFICATIONS");
  const loaded = await withDb<{
    ok: boolean;
    setting: Awaited<ReturnType<typeof prisma.telegramBotSetting.findUnique>>;
    recipients: Awaited<ReturnType<typeof prisma.telegramRecipient.findMany<{ include: { subscriptions: true } }>>>;
  }>(
    "telegram-settings",
    async () => {
      const [setting, recipients] = await Promise.all([
        prisma.telegramBotSetting.findUnique({ where: { id: "primary" } }),
        prisma.telegramRecipient.findMany({ include: { subscriptions: true }, orderBy: { name: "asc" } }),
      ]);
      return { ok: true, setting, recipients };
    },
    { ok: false, setting: null, recipients: [] },
  );
  const { setting, recipients } = loaded;
  const serverTokenReady = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
  const serverChatId = serverTelegramChatId();
  const knownChatIds = new Set(recipients.map((recipient) => recipient.chatId.trim()));
  const showServerChat = Boolean(serverChatId) && !knownChatIds.has(serverChatId);
  const botUsername = (process.env.TELEGRAM_BOT_USERNAME || setting?.botUsername || "").replace(/^@/, "");
  const botLink = /^[A-Za-z0-9_]+$/.test(botUsername) ? `https://t.me/${botUsername}` : "";
  const botReady = serverTokenReady || Boolean(setting?.isActive && setting.botTokenEncrypted);

  return (
    <div className="space-y-6">
      {notice ? <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{notice}</p> : null}
      {!loaded.ok ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">The chat list could not be loaded. Nothing on this page was changed.</p>
      ) : null}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Settings</p>
        <h1 className="font-display text-3xl font-bold">Telegram alerts</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          Add a personal chat, a group, or a channel. {botReady ? "The studio bot is connected." : "The studio bot is not connected yet, so a test cannot send."}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>How to find a chat id</CardTitle></CardHeader>
        <CardContent className="grid gap-4 text-sm leading-6 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <p className="font-semibold">1. Start the studio bot</p>
            <p className="mt-1 text-muted-foreground">Open the studio bot and press Start. For a group or channel, add the bot there and allow it to send messages. The same steps work for a personal chat, a group, or a channel.</p>
            {botLink ? (
              <a className="mt-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline" href={botLink} target="_blank" rel="noreferrer">
                @{botUsername}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="mt-2 text-muted-foreground">Use the bot already connected to this studio.</p>
            )}
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="font-semibold">2. Read the Id</p>
            <p className="mt-1 text-muted-foreground">Open @userinfobot and press Start. Copy the Id it shows. That is the number to save here, not an @username. The same bot shows the Id for a group or channel you can see.</p>
            <a className="mt-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline" href={userInfoBotUrl} target="_blank" rel="noreferrer">
              @userinfobot
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Add a personal, group, or channel id</CardTitle></CardHeader>
        <CardContent>
          <form action={createTelegramRecipient} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><Input name="name" placeholder="Studio desk" required /></Field>
              <Field label="Chat id"><Input name="chatId" placeholder="123456789 or -1001234567890" required inputMode="text" /></Field>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">Paste the Id from @userinfobot. An id that starts with - is a group or channel. A group receives only the alerts left ticked on its row. Payment alerts stay on a personal chat until you edit that group and tick them there too.</p>
            <TelegramNotificationChoices selected={telegramEventValues} />
            <div className="flex justify-end"><Button type="submit">Add chat id</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal, group, and channel ids</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">View shows the type, the chat id, whether sending is on, each alert, and recent sends. Edit changes the name, the chat id, sending on or off, and which alerts. Test checks that this bot can message that chat. Remove asks you to confirm first.</p>
          {recipients.length === 0 && !showServerChat ? (
            <p className="text-sm text-muted-foreground">No chat ids have been added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[46rem]">
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>Chat id</Th>
                    <Th className="min-w-[16rem]">Alerts</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((recipient) => {
                    const kind = telegramDestinationKind(recipient.chatId);
                    const selected = recipient.subscriptions.map((item) => item.event);
                    return (
                      <tr key={recipient.id}>
                        <Td>
                          <span className="font-semibold">{recipient.name}</span>
                          {recipient.isActive ? null : <span className="mt-1 block text-xs text-muted-foreground">Sending off</span>}
                        </Td>
                        <Td>{kind}</Td>
                        <Td className="font-mono text-xs">{recipient.chatId}</Td>
                        <Td className="min-w-[16rem] whitespace-normal text-sm leading-5">{alertSummary(selected)}</Td>
                        <Td className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/admin/settings/telegram/${recipient.id}`}><Eye className="h-4 w-4" />View</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/admin/settings/telegram/${recipient.id}/edit`}><Pencil className="h-4 w-4" />Edit</Link>
                            </Button>
                            <form action={testTelegramRecipient}>
                              <input type="hidden" name="id" value={recipient.id} />
                              <input type="hidden" name="returnTo" value="/admin/settings/telegram" />
                              <Button type="submit" variant="outline" size="sm"><Send className="h-4 w-4" />Test</Button>
                            </form>
                            <ConfirmDeleteButton
                              action={deleteTelegramRecipient}
                              id={recipient.id}
                              name={recipient.name}
                              label="Remove"
                              description={`${recipient.name} will stop receiving Telegram alerts.`}
                            />
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                  {showServerChat ? (
                    <tr>
                      <Td className="font-semibold">Server chat</Td>
                      <Td>{telegramDestinationKind(serverChatId)}</Td>
                      <Td className="font-mono text-xs">{serverChatId}</Td>
                      <Td className="min-w-[16rem] whitespace-normal text-sm leading-5">All alerts, until this id is added above</Td>
                      <Td className="text-right text-xs text-muted-foreground">Saved on the server</Td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </div>
          )}
          {showServerChat ? (
            <p className="text-sm leading-6 text-muted-foreground">This chat is saved on the server and is not in the list yet, so alerts still go there. Add the same id above to choose its alerts.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function alertSummary(events: string[]) {
  if (events.length === 0) return "None";
  if (events.length === telegramEvents.length) return "All alerts";
  return telegramEvents.filter((event) => events.includes(event.value)).map((event) => event.label).join(", ");
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><Label className="mb-2 block">{label}</Label>{children}</div>;
}
