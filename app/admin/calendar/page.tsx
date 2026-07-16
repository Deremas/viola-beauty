import BookingCalendar from "@/components/admin/booking-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/permissions";

export default async function CalendarPage() {
  await requirePermission("VIEW_CALENDAR");
  return (
    <Card>
      <CardHeader><CardTitle>Shared calendar</CardTitle></CardHeader>
      <CardContent>
        <BookingCalendar />
      </CardContent>
    </Card>
  );
}
