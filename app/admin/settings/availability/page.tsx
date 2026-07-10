import { prisma } from "@/lib/prisma";
import { createBreakTime, updateBreakTime, upsertWorkingHour } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AvailabilityPage() {
  const [hours, breaks] = await Promise.all([
    prisma.workingHour.findMany(),
    prisma.breakTime.findMany({ orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
  ]);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Working hours</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {dayNames.map((day, dayOfWeek) => {
            const row = hours.find((hour) => hour.dayOfWeek === dayOfWeek);
            return (
              <form key={day} action={upsertWorkingHour} className="grid items-end gap-3 rounded-md border bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
                <div className="font-medium">{day}</div>
                <Input name="openingTime" type="time" defaultValue={row?.openingTime || "09:00"} />
                <Input name="closingTime" type="time" defaultValue={row?.closingTime || "18:00"} />
                <Label className="flex items-center gap-2 pb-2"><input name="isOpen" type="checkbox" defaultChecked={row?.isOpen ?? true} /> Open</Label>
                <Button type="submit" variant="outline">Save working hours</Button>
              </form>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.7fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Add break time</CardTitle></CardHeader>
          <CardContent>
            <form action={createBreakTime} className="grid gap-3">
              <select name="dayOfWeek" className="h-10 rounded-md border bg-white px-3 text-sm">
                {dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="startTime" type="time" required />
                <Input name="endTime" type="time" required />
              </div>
              <Label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked /> Active</Label>
              <Button type="submit">Add break time</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Break times</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {breaks.length === 0 ? <p className="text-sm text-muted-foreground">No break times configured.</p> : null}
            {breaks.map((breakTime) => (
              <form key={breakTime.id} action={updateBreakTime} className="grid items-end gap-3 rounded-md border bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                <input type="hidden" name="id" value={breakTime.id} />
                <select name="dayOfWeek" defaultValue={breakTime.dayOfWeek} className="h-10 rounded-md border bg-white px-3 text-sm">
                  {dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}
                </select>
                <Input name="startTime" type="time" defaultValue={breakTime.startTime} />
                <Input name="endTime" type="time" defaultValue={breakTime.endTime} />
                <Label className="flex items-center gap-2 pb-2"><input name="isActive" type="checkbox" defaultChecked={breakTime.isActive} /> Active</Label>
                <Button type="submit" variant="outline">Update break time</Button>
              </form>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
