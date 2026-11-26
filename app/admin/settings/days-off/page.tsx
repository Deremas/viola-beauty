import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { appDate } from "@/lib/timezone";
import { UnavailableBlockForm } from "@/components/admin/unavailable-block-form";
import { createBreakTime, createDayOff, deleteBreakTime, deleteDayOff, updateBreakTime, updateDayOff } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function DaysOffPage() {
  await requirePermission("MANAGE_AVAILABILITY");
  const [daysOff, breaks, bookingSettings] = await Promise.all([
    prisma.dayOff.findMany({ orderBy: { date: "asc" } }),
    prisma.breakTime.findMany({ orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
    prisma.bookingSetting.findUnique({ where: { id: "primary" } }),
  ]);
  const timeStepSeconds = (bookingSettings?.slotIntervalMinutes === 30 ? 30 : 60) * 60;
  const formActions = {
    createDatedAction: createDayOff,
    createWeeklyAction: createBreakTime,
    updateDatedAction: updateDayOff,
    updateWeeklyAction: updateBreakTime,
    deleteDatedAction: deleteDayOff,
    deleteWeeklyAction: deleteBreakTime,
    timeStepSeconds,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Days off and blocked times</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          Working hours stay on <Link href="/admin/settings/availability" className="font-semibold text-primary">Availability</Link>. Use this screen to close the studio for a whole day, part of a day, or the same hours every week. Clients see the public title on a dated block.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Add a block</CardTitle></CardHeader>
          <CardContent>
            <UnavailableBlockForm {...formActions} framed={false} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Saved blocks</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {daysOff.length === 0 && breaks.length === 0 ? <p className="text-sm text-muted-foreground">No blocked times yet.</p> : null}
            {daysOff.map((day) => (
              <div key={day.id} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {day.isFullDay ? "Whole day" : "Part of a day"} · {appDate(day.date)} · Studio
                </p>
                <UnavailableBlockForm
                  {...formActions}
                  dated={{
                    id: day.id,
                    title: day.title,
                    date: appDate(day.date),
                    startTime: day.startTime || "",
                    endTime: day.endTime || "",
                    isFullDay: day.isFullDay,
                    note: day.note || "",
                  }}
                />
              </div>
            ))}
            {breaks.map((breakTime) => (
              <div key={breakTime.id} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Every week · {dayNames[breakTime.dayOfWeek]} · {breakTime.isActive ? "Active" : "Paused"} · Studio
                </p>
                <UnavailableBlockForm
                  {...formActions}
                  weekly={{
                    id: breakTime.id,
                    dayOfWeek: breakTime.dayOfWeek,
                    startTime: breakTime.startTime,
                    endTime: breakTime.endTime,
                    isActive: breakTime.isActive,
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
