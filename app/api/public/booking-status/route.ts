import { prisma } from "@/lib/prisma";
import { formatStatus } from "@/lib/format";
import { appTimezone } from "@/lib/timezone";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("251") && digits.length === 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("9") && digits.length === 9) return `0${digits}`;
  return digits;
}

function formatAppointment(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: appTimezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function statusMessage(status: string, paymentStatus?: string) {
  if (status === "CONFIRMED") return "Your appointment is confirmed. Please arrive on time for your service.";
  if (status === "COMPLETED") return "This appointment has been completed. Thank you for visiting Viola Brows and Beauty.";
  if (status === "CANCELLED") return "This appointment was cancelled. Please contact Viola if you need help booking another time.";
  if (status === "REJECTED" || paymentStatus === "PAYMENT_REJECTED") return "The payment proof was not accepted. Please contact Viola for help before making another payment.";
  if (status === "NO_SHOW") return "This appointment was marked as missed. Please contact Viola if you need assistance.";
  if (status === "EXPIRED") return "This booking request expired before it was confirmed. Please submit a new booking request.";
  if (status === "PAYMENT_UPLOADED" || paymentStatus === "PROOF_UPLOADED") return "Your payment proof was received and is waiting for staff review.";
  return "Your booking request is saved and waiting for payment review.";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const bookingCode = String(body?.bookingCode || "").trim().toUpperCase();
  const phone = normalizePhone(String(body?.phone || ""));

  if (phone.length < 7) {
    return Response.json({ error: "Enter the phone number used during booking." }, { status: 400 });
  }

  if (!bookingCode) {
    const possibleClients = await prisma.client.findMany({
      where: { phone: { contains: phone.slice(-8) } },
      select: { id: true, phone: true },
      take: 50,
    });
    const clientIds = possibleClients
      .filter((client) => normalizePhone(client.phone) === phone)
      .map((client) => client.id);

    const bookings = clientIds.length === 0
      ? []
      : await prisma.booking.findMany({
          where: {
            clientId: { in: clientIds },
          },
          select: {
            bookingCode: true,
            status: true,
            startDateTime: true,
            updatedAt: true,
            service: { select: { name: true } },
            payment: { select: { paymentStatus: true } },
          },
          orderBy: { startDateTime: "asc" },
          take: 30,
        });

    return Response.json(
      { bookings: bookings.map((booking) => publicBookingStatus(booking)) },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    select: {
      bookingCode: true,
      status: true,
      startDateTime: true,
      updatedAt: true,
      client: { select: { phone: true } },
      service: { select: { name: true } },
      payment: { select: { paymentStatus: true } },
    },
  });

  if (!booking || normalizePhone(booking.client.phone) !== phone) {
    return Response.json(
      { error: "We could not find a booking with that code and phone number." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(publicBookingStatus(booking), { headers: { "Cache-Control": "no-store" } });
}

function publicBookingStatus(booking: {
  bookingCode: string;
  status: string;
  startDateTime: Date;
  updatedAt: Date;
  service: { name: string };
  payment: { paymentStatus: string } | null;
}) {
  const paymentStatus = booking.payment?.paymentStatus || "NOT_PAID";
  return {
    bookingCode: booking.bookingCode,
    bookingStatus: booking.status,
    bookingStatusLabel: formatStatus(booking.status),
    paymentStatus,
    paymentStatusLabel: formatStatus(paymentStatus),
    service: booking.service.name,
    appointmentTimestamp: booking.startDateTime.toISOString(),
    appointment: formatAppointment(booking.startDateTime),
    lastUpdated: formatAppointment(booking.updatedAt),
    message: statusMessage(booking.status, booking.payment?.paymentStatus),
  };
}
