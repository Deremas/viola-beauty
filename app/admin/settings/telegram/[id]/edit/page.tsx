import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { telegramDestinationKind } from "@/lib/telegram-chat-id";
import { updateTelegramRecipient } from "../../actions";
import { TelegramNotificationChoices } from "@/components/admin/telegram-notification-choices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function EditTelegramRecipientPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("MANAGE_NOTIFICATIONS");
  const { id } = await params;
  const recipient = await prisma.telegramRecipient.findUnique({
    where: { id },
    include: { subscriptions: true },
  });
  if (!recipient) notFound();
  const kind = telegramDestinationKind(recipient.chatId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="outline">
        <Link href={`/admin/settings/telegram/${recipient.id}`}><ArrowLeft className="h-4 w-4" />Back to {recipient.name}</Link>
      </Button>
      <Card>
        <CardHeader><CardTitle>Edit {recipient.name}</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            This is a {kind.toLowerCase()} chat. Saving changes the name, the chat id, whether sending is on, and which alerts this row receives. Other chats stay as they are.
          </p>
          <form action={updateTelegramRecipient} className="grid gap-4">
            <input type="hidden" name="id" value={recipient.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block" htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={recipient.name} required />
              </div>
              <div>
                <Label className="mb-2 block" htmlFor="chatId">Chat id</Label>
                <Input id="chatId" name="chatId" defaultValue={recipient.chatId} required inputMode="text" />
              </div>
            </div>
            <Label className="flex items-center gap-2">
              <input name="isActive" type="checkbox" defaultChecked={recipient.isActive} />
              Send alerts to this chat
            </Label>
            <TelegramNotificationChoices selected={recipient.subscriptions.map((item) => item.event)} />
            <div className="flex justify-end"><Button type="submit">Save chat</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
