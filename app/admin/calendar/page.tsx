import BookingCalendar from "@/components/admin/booking-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Shared calendar</CardTitle></CardHeader>
      <CardContent>
        <BookingCalendar />
      </CardContent>
    </Card>
  );
}
