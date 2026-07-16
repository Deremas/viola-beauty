"use client";

import { useState } from "react";
import { telegramEvents } from "@/lib/telegram-events";
import { Label } from "@/components/ui/label";

export function TelegramNotificationChoices({ selected = [] }: { selected?: string[] }) {
  const [selectedEvents, setSelectedEvents] = useState(() => new Set(selected));
  const receivesAll = selectedEvents.size === telegramEvents.length;

  function setAll(checked: boolean) {
    setSelectedEvents(checked ? new Set(telegramEvents.map((event) => event.value)) : new Set());
  }

  function setEvent(value: string, checked: boolean) {
    setSelectedEvents((current) => {
      const next = new Set(current);
      if (checked) next.add(value);
      else next.delete(value);
      return next;
    });
  }

  return (
    <fieldset className="rounded-lg border bg-background/60 p-4">
      <legend className="px-1 text-sm font-semibold">Notifications to receive</legend>
      <Label className="mb-3 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
        <input
          name="notifyAll"
          type="checkbox"
          checked={receivesAll}
          onChange={(event) => setAll(event.target.checked)}
        />
        All notifications
      </Label>
      <div className="grid gap-3 sm:grid-cols-2">
        {telegramEvents.map((event) => (
          <Label key={event.value} className="flex items-start gap-2 rounded-md border bg-white p-3">
            <input
              className="mt-1"
              name="events"
              type="checkbox"
              value={event.value}
              checked={selectedEvents.has(event.value)}
              onChange={(inputEvent) => setEvent(event.value, inputEvent.target.checked)}
            />
            <span>
              <span className="block font-semibold">{event.label}</span>
              <span className="block text-xs font-normal text-muted-foreground">{event.description}</span>
            </span>
          </Label>
        ))}
      </div>
    </fieldset>
  );
}
