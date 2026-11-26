import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { applyWorkingHoursToDays, saveBookingSlotInterval, saveWeeklyWorkingHours } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AvailabilityPage() {
  await requirePermission("MANAGE_AVAILABILITY");
  const [hours, bookingSettings] = await Promise.all([
    prisma.workingHour.findMany(),
    prisma.bookingSetting.findUnique({ where: { id: "primary" } }),
  ]);
  const timeStepSeconds = (bookingSettings?.slotIntervalMinutes === 30 ? 30 : 60) * 60;

  return <div className="space-y-6">
    <div><h1 className="font-display text-3xl font-bold">Availability</h1><p className="text-sm text-muted-foreground">Set the studio&apos;s weekly opening hours. Days off, part-day blocks, and weekly breaks are on <Link href="/admin/settings/days-off" className="font-semibold text-primary">Days off</Link>.</p></div>

    <Card><CardHeader><CardTitle>Appointment start times</CardTitle></CardHeader><CardContent>
      <form action={saveBookingSlotInterval} className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl"><Label className="mb-2 block">How often a new appointment may start</Label><Select name="slotIntervalMinutes" defaultValue={String(bookingSettings?.slotIntervalMinutes === 30 ? 30 : 60)}><option value="60">Every hour (recommended)</option><option value="30">Every 30 minutes</option></Select><p className="mt-2 text-sm text-muted-foreground">Hourly is the default. Choose 30 minutes only when clients should be able to start at times such as 9:30 AM.</p></div>
        <Button type="submit">Save appointment times</Button>
      </form>
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Quick schedule setup</CardTitle></CardHeader><CardContent>
      <form action={applyWorkingHoursToDays} className="grid gap-4">
        <div><Label className="mb-2 block">Apply to selected days</Label><div className="flex flex-wrap gap-2">{dayNames.map((day, index) => <Label key={day} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"><input name="days" type="checkbox" value={index} defaultChecked={index >= 1 && index <= 6} />{day}</Label>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-3"><div><Label className="mb-2 block">Opening time</Label><Input name="openingTime" type="time" step={timeStepSeconds} defaultValue="09:00" required /></div><div><Label className="mb-2 block">Closing time</Label><Input name="closingTime" type="time" step={timeStepSeconds} defaultValue="18:00" required /></div><Label className="flex items-center gap-2 self-end pb-3"><input name="isOpen" type="checkbox" defaultChecked />Selected days are open</Label></div>
        <div className="flex justify-end"><Button type="submit">Apply hours to selected days</Button></div>
      </form>
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Weekly working hours</CardTitle></CardHeader><CardContent>
      <form action={saveWeeklyWorkingHours} className="space-y-3">
        {dayNames.map((day, dayOfWeek) => { const row = hours.find((hour) => hour.dayOfWeek === dayOfWeek); return <div key={day} className="grid items-center gap-3 rounded-md border bg-white p-3 sm:grid-cols-[minmax(7rem,1fr)_1fr_1fr_auto]">
          <div className="font-semibold">{day}</div>
          <div><Label className="mb-1 block text-xs">Opens</Label><Input name={`openingTime_${dayOfWeek}`} type="time" step={timeStepSeconds} defaultValue={row?.openingTime || "09:00"} /></div>
          <div><Label className="mb-1 block text-xs">Closes</Label><Input name={`closingTime_${dayOfWeek}`} type="time" step={timeStepSeconds} defaultValue={row?.closingTime || "18:00"} /></div>
          <Label className="flex items-center gap-2"><input name={`isOpen_${dayOfWeek}`} type="checkbox" defaultChecked={row?.isOpen ?? true} />Open</Label>
        </div>; })}
        <div className="flex justify-end pt-2"><Button type="submit">Save full weekly schedule</Button></div>
      </form>
    </CardContent></Card>
  </div>;
}
