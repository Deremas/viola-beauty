import BookingCalendar from "@/components/admin/booking-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function CalendarPage() {
  await requirePermission("VIEW_CALENDAR");
  const [settings, services] = await Promise.all([
    prisma.bookingSetting.findUnique({ where: { id: "primary" } }),
    prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      select: { durationMinutes: true },
    }),
  ]);
  const showHalfHourGrid = settings?.slotIntervalMinutes === 30
    || services.some((service) => service.durationMinutes % 60 !== 0);
  return (
    <Card>
      <CardHeader><CardTitle>Shared calendar</CardTitle><p className="text-sm text-muted-foreground">All calendar times use East Africa Time (EAT, UTC+3). Half-hour lines appear only when enabled or needed by a service.</p></CardHeader>
      <CardContent>
        <BookingCalendar showHalfHourGrid={showHalfHourGrid} />
      </CardContent>
    </Card>
  );
}
