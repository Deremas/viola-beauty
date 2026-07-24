import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { appDate } from "@/lib/timezone";
import { createDayOff, deleteDayOff, updateDayOff } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function DaysOffPage() {
  await requirePermission("MANAGE_AVAILABILITY");
  const [daysOff, bookingSettings] = await Promise.all([
    prisma.dayOff.findMany({ orderBy: { date: "asc" } }),
    prisma.bookingSetting.findUnique({ where: { id: "primary" } }),
  ]);
  const timeStepSeconds = (bookingSettings?.slotIntervalMinutes === 30 ? 30 : 60) * 60;

  return <div className="space-y-6">
    <div><h1 className="font-display text-3xl font-bold">Days off and blocked times</h1><p className="text-sm text-muted-foreground">Close a full date or block only part of a date. Clients will see the public title when checking that date.</p></div>
    <div className="grid gap-6 xl:grid-cols-[0.7fr_1fr]">
      <Card><CardHeader><CardTitle>Add unavailable date</CardTitle></CardHeader><CardContent><form action={createDayOff} className="grid gap-4">
        <div><Label className="mb-2 block">Public title</Label><Input name="title" placeholder="Closed for training" required /></div>
        <div><Label className="mb-2 block">Date</Label><Input name="date" type="date" required /></div>
        <div className="grid gap-3 sm:grid-cols-2"><div><Label className="mb-2 block">Unavailable from</Label><Input name="startTime" type="time" step={timeStepSeconds} /></div><div><Label className="mb-2 block">Unavailable until</Label><Input name="endTime" type="time" step={timeStepSeconds} /></div></div>
        <Label className="flex items-center gap-2"><input name="isFullDay" type="checkbox" defaultChecked />Closed for the full day</Label>
        <div><Label className="mb-2 block">Internal note optional</Label><Textarea name="note" placeholder="Visible to staff only" /></div>
        <div className="flex justify-end"><Button type="submit">Add unavailable date</Button></div>
      </form></CardContent></Card>

      <Card><CardHeader><CardTitle>Configured days off</CardTitle></CardHeader><CardContent className="space-y-4">
        {daysOff.length === 0 ? <p className="text-sm text-muted-foreground">No days off have been configured.</p> : null}
        {daysOff.map((day) => <form key={day.id} action={updateDayOff} className="grid gap-4 rounded-lg border bg-white p-4">
          <input type="hidden" name="id" value={day.id} />
          <div className="grid gap-3 sm:grid-cols-2"><div><Label className="mb-2 block">Public title</Label><Input name="title" defaultValue={day.title} required /></div><div><Label className="mb-2 block">Date</Label><Input name="date" type="date" defaultValue={appDate(day.date)} required /></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><div><Label className="mb-2 block">Unavailable from</Label><Input name="startTime" type="time" step={timeStepSeconds} defaultValue={day.startTime || ""} /></div><div><Label className="mb-2 block">Unavailable until</Label><Input name="endTime" type="time" step={timeStepSeconds} defaultValue={day.endTime || ""} /></div></div>
          <Label className="flex items-center gap-2"><input name="isFullDay" type="checkbox" defaultChecked={day.isFullDay} />Closed for the full day</Label>
          <div><Label className="mb-2 block">Internal note</Label><Textarea name="note" defaultValue={day.note || ""} /></div>
          <div className="flex justify-end gap-2"><Button type="submit" variant="outline">Save day off</Button><Button formAction={deleteDayOff} type="submit" variant="destructive"><Trash2 className="h-4 w-4" />Delete day off</Button></div>
        </form>)}
      </CardContent></Card>
    </div>
  </div>;
}
