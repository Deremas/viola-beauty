"use server";

import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";
import { isSlotAvailable } from "@/lib/booking-engine";
import { prisma } from "@/lib/prisma";
import { canConfirmPayment, requireUser } from "@/lib/permissions";
import { localDateTimeToUtc } from "@/lib/timezone";

async function changeStatus(bookingId: string, newStatus: "CANCELLED" | "COMPLETED" | "NO_SHOW") {
  const user = await requireUser();
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        cancelledByUserId: newStatus === "CANCELLED" ? user.id : undefined,
      },
    }),
    prisma.bookingStatusLog.create({
      data: { bookingId, oldStatus: booking.status, newStatus, changedByUserId: user.id },
    }),
  ]);
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function confirmPayment(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  const user = await requireUser();
  if (!canConfirmPayment(user.role)) throw new Error("Forbidden");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
  if (!booking || !booking.payment) throw new Error("Booking not found");

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { paymentStatus: "ADVANCE_CONFIRMED", verifiedByUserId: user.id, verifiedAt: new Date() },
    }),
    prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED", confirmedByUserId: user.id } }),
    prisma.bookingStatusLog.create({
      data: { bookingId, oldStatus: booking.status, newStatus: "CONFIRMED", changedByUserId: user.id, note: "Advance payment confirmed" },
    }),
  ]);
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function rejectPayment(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  const reason = String(formData.get("reason") || "Payment rejected");
  const user = await requireUser();
  if (!canConfirmPayment(user.role)) throw new Error("Forbidden");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
  if (!booking || !booking.payment) throw new Error("Booking not found");

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { paymentStatus: "PAYMENT_REJECTED", rejectionReason: reason, verifiedByUserId: user.id, verifiedAt: new Date() },
    }),
    prisma.booking.update({ where: { id: bookingId }, data: { status: "REJECTED" } }),
    prisma.bookingStatusLog.create({
      data: { bookingId, oldStatus: booking.status, newStatus: "REJECTED", changedByUserId: user.id, note: reason },
    }),
  ]);
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function cancelBooking(formData: FormData) {
  await changeStatus(String(formData.get("bookingId")), "CANCELLED");
}

export async function completeBooking(formData: FormData) {
  await changeStatus(String(formData.get("bookingId")), "COMPLETED");
}

export async function markNoShow(formData: FormData) {
  await changeStatus(String(formData.get("bookingId")), "NO_SHOW");
}

export async function rescheduleBooking(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const user = await requireUser();

  if (!date || !time) throw new Error("Choose a new date and time");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });
  if (!booking) throw new Error("Booking not found");

  const startDateTime = localDateTimeToUtc(date, time);
  if (!(await isSlotAvailable(booking.serviceId, startDateTime, booking.id))) {
    throw new Error("This new slot is unavailable");
  }

  const endDateTime = addMinutes(startDateTime, booking.service.durationMinutes + booking.service.bufferMinutes);
  const oldStart = booking.startDateTime.toLocaleString("en-US");
  const newStart = startDateTime.toLocaleString("en-US");

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { startDateTime, endDateTime },
    }),
    prisma.bookingStatusLog.create({
      data: {
        bookingId,
        oldStatus: booking.status,
        newStatus: booking.status,
        changedByUserId: user.id,
        note: `Rescheduled from ${oldStart} to ${newStart}`,
      },
    }),
  ]);

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
}
