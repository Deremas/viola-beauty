import { prisma } from "@/lib/prisma";
import { formatStatus, shortDateTime } from "@/lib/format";
import { apiError } from "@/lib/api-error";
import { consumeRateLimit, securitySettings } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/security";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("251") && digits.length === 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("9") && digits.length === 9) return `0${digits}`;
  return digits;
}

function statusMessage(status: string, paymentStatus?: string, forfeitedAdvanceAmount = 0) {
  if (status === "CONFIRMED") return "Your appointment is confirmed. Please arrive on time for your service.";
  if (status === "COMPLETED") return "This appointment has been completed. Thank you for visiting Viola Brows and Beauty.";
  if (status === "CANCELLED") return "This appointment was cancelled. Please contact Viola if you need help booking another time.";
  if (status === "REJECTED" || paymentStatus === "PAYMENT_REJECTED") return "The payment proof was not accepted. Please contact Viola for help before making another payment.";
  if (status === "NO_SHOW" || (status === "EXPIRED" && forfeitedAdvanceAmount > 0)) {
    return `This appointment expired because it was marked as a no-show. Your ${forfeitedAdvanceAmount.toLocaleString("en-US")} ETB advance is non-refundable and cannot be moved to another booking. To book again, make a new booking and pay a new advance.`;
  }
  if (status === "EXPIRED") return "This booking request expired before it was confirmed. Please make a new booking request.";
  if (status === "PAYMENT_UPLOADED" || paymentStatus === "PROOF_UPLOADED") return "Your payment proof was received and is waiting for staff review.";
  return "Your booking request is saved and waiting for payment review.";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const bookingCode = String(body?.bookingCode || "").trim().toUpperCase();
  const phone = normalizePhone(String(body?.phone || ""));
  try {
    const settings = await securitySettings();
    await Promise.all([
      consumeRateLimit({ action: "booking-status-ip", identifier: getRequestIp(request.headers), limit: settings.statusMax, windowSeconds: settings.statusWindowSeconds }),
      consumeRateLimit({ action: "booking-status-phone", identifier: phone || "empty", limit: settings.statusMax, windowSeconds: settings.statusWindowSeconds }),
    ]);
  } catch (error) {
    return apiError(error, "Booking status is temporarily unavailable. Please try again.");
  }

  if (phone.length < 7) {
    return Response.json({ error: "Enter the phone number used during booking." }, { status: 400 });
  }
  const hasFullPrecautions = Boolean(await prisma.precautionDocument.findFirst({
    where: { isActive: true },
    select: { id: true },
  }));

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
            precautionNoticeSnapshot: true,
            service: { select: { name: true } },
            payment: { select: { paymentStatus: true, advanceForfeitedAmount: true } },
          },
          orderBy: { startDateTime: "asc" },
          take: 30,
        });

    return Response.json(
      { bookings: bookings.map((booking) => publicBookingStatus(booking, hasFullPrecautions)) },
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
      precautionNoticeSnapshot: true,
      client: { select: { phone: true } },
      service: { select: { name: true } },
      payment: { select: { paymentStatus: true, advanceForfeitedAmount: true } },
    },
  });

  if (!booking || normalizePhone(booking.client.phone) !== phone) {
    return Response.json(
      { error: "We could not find a booking with that code and phone number." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(publicBookingStatus(booking, hasFullPrecautions), { headers: { "Cache-Control": "no-store" } });
}

function publicBookingStatus(booking: {
  bookingCode: string;
  status: string;
  startDateTime: Date;
  updatedAt: Date;
  precautionNoticeSnapshot: string | null;
  service: { name: string };
  payment: { paymentStatus: string; advanceForfeitedAmount: { toString(): string } | null } | null;
}, hasFullPrecautions: boolean) {
  const paymentStatus = booking.payment?.paymentStatus || "NOT_PAID";
  const advanceForfeitedAmount = Number(booking.payment?.advanceForfeitedAmount || 0);
  const advanceForfeited = advanceForfeitedAmount > 0;
  return {
    bookingCode: booking.bookingCode,
    bookingStatus: booking.status,
    bookingStatusLabel: advanceForfeited ? "Expired - No-show" : formatStatus(booking.status),
    paymentStatus,
    paymentStatusLabel: formatStatus(paymentStatus),
    service: booking.service.name,
    appointmentTimestamp: booking.startDateTime.toISOString(),
    appointment: shortDateTime(booking.startDateTime),
    lastUpdated: shortDateTime(booking.updatedAt),
    precaution: parsePrecautionSnapshot(booking.precautionNoticeSnapshot),
    hasFullPrecautions,
    advanceForfeited,
    advanceForfeitedAmount,
    message: statusMessage(booking.status, booking.payment?.paymentStatus, advanceForfeitedAmount),
  };
}

function parsePrecautionSnapshot(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as {
      title?: string;
      intro?: string | null;
      instructions?: string | null;
      contact?: string | null;
    };
    return {
      title: parsed.title || "Service precautions",
      intro: parsed.intro || "",
      instructions: (parsed.instructions || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      contact: parsed.contact || "",
    };
  } catch {
    return null;
  }
}
