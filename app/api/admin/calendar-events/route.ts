import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { formatStatus } from "@/lib/format";
import { appTimezone, calendarLocalIso, calendarRangeToUtc } from "@/lib/timezone";

function getColor(status: string) {
  if (status === "CONFIRMED") return "#16a34a";
  if (status === "PAYMENT_UPLOADED") return "#f59e0b";
  if (status === "CANCELLED" || status === "REJECTED") return "#dc2626";
  if (status === "COMPLETED") return "#2563eb";
  return "#6b7280";
}

export async function GET(request: Request) {
  await requirePermission("VIEW_CALENDAR");
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const bookings = await prisma.booking.findMany({
    where: {
      startDateTime: start ? { gte: calendarRangeToUtc(start) } : undefined,
      endDateTime: end ? { lte: calendarRangeToUtc(end) } : undefined,
      status: { notIn: ["REJECTED", "EXPIRED"] },
    },
    include: { client: true, service: true, payment: { select: { paymentStatus: true } }, bookedBy: true },
  });

  return Response.json(
    bookings.map((booking) => ({
      id: booking.id,
      title: `${formatCalendarTime(booking.startDateTime)} - ${booking.client.fullName} - ${booking.service.name}`,
      start: calendarLocalIso(booking.startDateTime),
      end: calendarLocalIso(booking.endDateTime),
      backgroundColor: getColor(booking.status),
      borderColor: getColor(booking.status),
      textColor: "#ffffff",
      extendedProps: {
        bookingCode: booking.bookingCode,
        status: formatStatus(booking.status),
        paymentStatus: booking.payment?.paymentStatus ? formatStatus(booking.payment.paymentStatus) : "No payment",
        phone: booking.client.phone,
        source: booking.source,
        bookedBy: booking.bookedBy?.name || "Online Client",
        service: booking.service.name,
        client: booking.client.fullName,
      },
    })),
  );
}

function formatCalendarTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: appTimezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}
