import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { formatStatus } from "@/lib/format";

function getColor(status: string) {
  if (status === "CONFIRMED") return "#16a34a";
  if (status === "PAYMENT_UPLOADED") return "#f59e0b";
  if (status === "CANCELLED" || status === "REJECTED") return "#dc2626";
  if (status === "COMPLETED") return "#2563eb";
  return "#6b7280";
}

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const bookings = await prisma.booking.findMany({
    where: {
      startDateTime: start ? { gte: new Date(start) } : undefined,
      endDateTime: end ? { lte: new Date(end) } : undefined,
      status: { notIn: ["REJECTED", "EXPIRED"] },
    },
    include: { client: true, service: true, payment: { select: { paymentStatus: true } }, bookedBy: true },
  });

  return Response.json(
    bookings.map((booking) => ({
      id: booking.id,
      title: `${booking.startDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${booking.client.fullName} - ${booking.service.name}`,
      start: booking.startDateTime,
      end: booking.endDateTime,
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
