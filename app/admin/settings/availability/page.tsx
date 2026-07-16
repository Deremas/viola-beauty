import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { applyWorkingHoursToDays, createBreakTime, deleteBreakTime, saveWeeklyWorkingHours, updateBreakTime } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AvailabilityPage() {
  await requirePermission("MANAGE_AVAILABILITY");
  const [hours, breaks] = await Promise.all([
    prisma.workingHour.findMany(),
    prisma.breakTime.findMany({ orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
  ]);

  return <div className="space-y-6">
    <div><h1 className="font-display text-3xl font-bold">Availability</h1><p className="text-sm text-muted-foreground">Set the normal weekly schedule and recurring breaks used to calculate client booking times.</p></div>

    <Card><CardHeader><CardTitle>Quick schedule setup</CardTitle></CardHeader><CardContent>
      <form action={applyWorkingHoursToDays} className="grid gap-4">
        <div><Label className="mb-2 block">Apply to selected days</Label><div className="flex flex-wrap gap-2">{dayNames.map((day, index) => <Label key={day} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"><input name="days" type="checkbox" value={index} defaultChecked={index >= 1 && index <= 6} />{day}</Label>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-3"><div><Label className="mb-2 block">Opening time</Label><Input name="openingTime" type="time" defaultValue="09:00" required /></div><div><Label className="mb-2 block">Closing time</Label><Input name="closingTime" type="time" defaultValue="18:00" required /></div><Label className="flex items-center gap-2 self-end pb-3"><input name="isOpen" type="checkbox" defaultChecked />Selected days are open</Label></div>
        <div className="flex justify-end"><Button type="submit">Apply hours to selected days</Button></div>
      </form>
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Weekly working hours</CardTitle></CardHeader><CardContent>
      <form action={saveWeeklyWorkingHours} className="space-y-3">
        {dayNames.map((day, dayOfWeek) => { const row = hours.find((hour) => hour.dayOfWeek === dayOfWeek); return <div key={day} className="grid items-center gap-3 rounded-md border bg-white p-3 sm:grid-cols-[minmax(7rem,1fr)_1fr_1fr_auto]">
          <div className="font-semibold">{day}</div>
          <div><Label className="mb-1 block text-xs">Opens</Label><Input name={`openingTime_${dayOfWeek}`} type="time" defaultValue={row?.openingTime || "09:00"} /></div>
          <div><Label className="mb-1 block text-xs">Closes</Label><Input name={`closingTime_${dayOfWeek}`} type="time" defaultValue={row?.closingTime || "18:00"} /></div>
          <Label className="flex items-center gap-2"><input name={`isOpen_${dayOfWeek}`} type="checkbox" defaultChecked={row?.isOpen ?? true} />Open</Label>
        </div>; })}
        <div className="flex justify-end pt-2"><Button type="submit">Save full weekly schedule</Button></div>
      </form>
    </CardContent></Card>

    <div className="grid gap-6 xl:grid-cols-[0.7fr_1fr]">
      <Card><CardHeader><CardTitle>Add recurring break</CardTitle></CardHeader><CardContent><form action={createBreakTime} className="grid gap-4">
        <div><Label className="mb-2 block">Day</Label><Select name="dayOfWeek">{dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}</Select></div>
        <div className="grid gap-3 sm:grid-cols-2"><div><Label className="mb-2 block">Break starts</Label><Input name="startTime" type="time" required /></div><div><Label className="mb-2 block">Break ends</Label><Input name="endTime" type="time" required /></div></div>
        <Label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked />Block client booking times during this break</Label>
        <div className="flex justify-end"><Button type="submit">Add recurring break</Button></div>
      </form></CardContent></Card>

      <Card><CardHeader><CardTitle>Recurring breaks</CardTitle></CardHeader><CardContent className="space-y-3">
        {breaks.length === 0 ? <p className="text-sm text-muted-foreground">No recurring breaks configured.</p> : null}
        {breaks.map((breakTime) => <form key={breakTime.id} action={updateBreakTime} className="grid items-end gap-3 rounded-md border bg-white p-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <input type="hidden" name="id" value={breakTime.id} /><Select name="dayOfWeek" defaultValue={breakTime.dayOfWeek}>{dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}</Select><Input name="startTime" type="time" defaultValue={breakTime.startTime} /><Input name="endTime" type="time" defaultValue={breakTime.endTime} /><Label className="flex items-center gap-2 pb-2"><input name="isActive" type="checkbox" defaultChecked={breakTime.isActive} />Active</Label><div className="flex gap-2"><Button type="submit" variant="outline">Save break</Button><Button formAction={deleteBreakTime} type="submit" variant="destructive" size="icon" title="Delete break"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete break</span></Button></div>
        </form>)}
      </CardContent></Card>
    </div>
  </div>;
}
