import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { telegramEvents } from "@/lib/telegram-events";
import { telegramDestinationKind } from "@/lib/telegram-chat-id";
import { withDb } from "@/lib/db-safe";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteTelegramRecipient, testTelegramRecipient } from "../actions";

export default async function TelegramRecipientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const { id } = await params;
  const { notice } = await searchParams;
  const recipient = await prisma.telegramRecipient.findUnique({
    where: { id },
    include: { subscriptions: true },
  });
  if (!recipient) notFound();

  const kind = telegramDestinationKind(recipient.chatId);
  const selected = new Set(recipient.subscriptions.map((item) => item.event));
  const logs = await withDb(
    "telegram-sends",
    () => prisma.notificationLog.findMany({
      where: { channel: "TELEGRAM", recipient: { contains: `(${recipient.chatId})` } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, status: true, errorMessage: true, createdAt: true, message: true },
    }),
    [],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {notice ? <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{notice}</p> : null}
      <Button asChild variant="outline">
        <Link href="/admin/settings/telegram"><ArrowLeft className="h-4 w-4" />Back to Telegram alerts</Link>
      </Button>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{recipient.name}</CardTitle>
          <Button asChild size="sm">
            <Link href={`/admin/settings/telegram/${recipient.id}/edit`}><Pencil className="h-4 w-4" />Edit</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Type</dt><dd className="font-semibold">{kind}</dd></div>
            <div><dt className="text-muted-foreground">Chat id</dt><dd className="font-mono font-semibold">{recipient.chatId}</dd></div>
            <div><dt className="text-muted-foreground">Sending</dt><dd className="font-semibold">{recipient.isActive ? "On" : "Off"}</dd></div>
            <div><dt className="text-muted-foreground">Alerts</dt><dd className="font-semibold">{selected.size} of {telegramEvents.length}</dd></div>
          </dl>
          <ul className="grid gap-2 sm:grid-cols-2">
            {telegramEvents.map((event) => (
              <li key={event.value} className="rounded-md border bg-white px-3 py-2 text-sm">
                <span className="font-semibold">{selected.has(event.value) ? "On" : "Off"} · {event.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{event.description}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap justify-end gap-2">
            <form action={testTelegramRecipient}>
              <input type="hidden" name="id" value={recipient.id} />
              <input type="hidden" name="returnTo" value={`/admin/settings/telegram/${recipient.id}`} />
              <Button type="submit" variant="outline"><Send className="h-4 w-4" />Send test</Button>
            </form>
            <ConfirmDeleteButton
              action={deleteTelegramRecipient}
              id={recipient.id}
              name={recipient.name}
              label="Remove"
              description={`${recipient.name} will stop receiving Telegram alerts.`}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent sends</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {logs.length === 0 ? <p className="text-sm text-muted-foreground">No Telegram send has been recorded for this chat id yet.</p> : null}
          {logs.map((log) => (
            <div key={log.id} className="rounded-md border bg-white px-3 py-2 text-sm">
              <p className="font-semibold">{log.status === "sent" ? "Sent" : "Failed"} · {log.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
              <p className="mt-1 line-clamp-2 text-muted-foreground">{log.message}</p>
              {log.errorMessage ? <p className="mt-1 text-destructive">{log.errorMessage}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
