"use server";

import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";
import { isSlotAvailable } from "@/lib/booking-engine";
import { prisma } from "@/lib/prisma";
import { canConfirmPayment, requireUser } from "@/lib/permissions";
import { localDateTimeToUtc } from "@/lib/timezone";
import { sendTelegramBookingNotification } from "@/lib/telegram";
import { shortDateTime } from "@/lib/format";
import { sendClientBookingSms } from "@/lib/sms";

async function changeStatus(bookingId: string, newStatus: "CANCELLED" | "COMPLETED" | "NO_SHOW") {
  const user = await requireUser();
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
  if (!booking) throw new Error("Booking not found");
  if (newStatus === "COMPLETED" && booking.payment?.paymentStatus !== "FULLY_PAID") {
    throw new Error("Record full payment before completing this booking");
  }

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
  const event = {
    CANCELLED: "BOOKING_CANCELLED",
    COMPLETED: "BOOKING_COMPLETED",
    NO_SHOW: "BOOKING_NO_SHOW",
  }[newStatus] as "BOOKING_CANCELLED" | "BOOKING_COMPLETED" | "BOOKING_NO_SHOW";
  await sendTelegramBookingNotification(bookingId, event);
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function confirmPayment(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  const user = await requireUser();
  if (!canConfirmPayment(user.role)) throw new Error("Forbidden");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true, service: true } });
  if (!booking || !booking.payment) throw new Error("Booking not found");
  if (booking.payment.paymentStatus !== "PROOF_UPLOADED") throw new Error("This payment has already been reviewed");

  const paidAmount = Number(formData.get("paidAmount"));
  const paymentMethod = String(formData.get("paymentMethod") || "").trim();
  const requiredAdvance = Number(booking.payment.requiredAdvanceAmount);
  const servicePrice = Number(booking.service.price);
  if (!Number.isFinite(paidAmount) || paidAmount < requiredAdvance) {
    throw new Error(`Amount received must be at least ${requiredAdvance} ETB`);
  }
  if (!paymentMethod) throw new Error("Choose a payment method");
  const paymentStatus = paidAmount >= servicePrice ? "FULLY_PAID" : "ADVANCE_CONFIRMED";

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { paymentStatus, paidAmount, paymentMethod, verifiedByUserId: user.id, verifiedAt: new Date(), rejectionReason: null },
    }),
    prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED", confirmedByUserId: user.id } }),
    prisma.bookingStatusLog.create({
      data: {
        bookingId,
        oldStatus: booking.status,
        newStatus: "CONFIRMED",
        changedByUserId: user.id,
        note: paymentStatus === "FULLY_PAID" ? `Full payment confirmed: ${paidAmount} ETB` : `Advance payment confirmed: ${paidAmount} ETB`,
      },
    }),
  ]);
  await sendTelegramBookingNotification(bookingId, "PAYMENT_CONFIRMED");
  await sendClientBookingSms(bookingId, "PAYMENT_CONFIRMED");
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function recordAdditionalPayment(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  const additionalAmount = Number(formData.get("additionalAmount"));
  const paymentMethod = String(formData.get("paymentMethod") || "").trim();
  const user = await requireUser();
  if (!canConfirmPayment(user.role)) throw new Error("Forbidden");
  if (!Number.isFinite(additionalAmount) || additionalAmount <= 0) throw new Error("Enter a positive payment amount");
  if (!paymentMethod) throw new Error("Choose a payment method");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, service: true },
  });
  if (!booking?.payment) throw new Error("Booking payment not found");
  if (booking.payment.paymentStatus !== "ADVANCE_CONFIRMED") throw new Error("Additional payment cannot be recorded for this booking");

  const currentPaid = Number(booking.payment.paidAmount || booking.payment.requiredAdvanceAmount);
  const servicePrice = Number(booking.service.price);
  const totalPaid = currentPaid + additionalAmount;
  if (totalPaid > servicePrice) throw new Error(`Payment exceeds the remaining balance of ${servicePrice - currentPaid} ETB`);
  const paymentStatus = totalPaid >= servicePrice ? "FULLY_PAID" : "ADVANCE_CONFIRMED";

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { paidAmount: totalPaid, paymentStatus, paymentMethod, verifiedByUserId: user.id, verifiedAt: new Date() },
    }),
    prisma.bookingStatusLog.create({
      data: {
        bookingId,
        oldStatus: booking.status,
        newStatus: booking.status,
        changedByUserId: user.id,
        note: paymentStatus === "FULLY_PAID"
          ? `Full payment completed by ${paymentMethod}. Total paid: ${totalPaid} ETB`
          : `Additional payment recorded by ${paymentMethod}: ${additionalAmount} ETB. Total paid: ${totalPaid} ETB`,
      },
    }),
  ]);

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/payments");
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
  await sendTelegramBookingNotification(bookingId, "PAYMENT_REJECTED", reason);
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
  const oldStart = shortDateTime(booking.startDateTime);
  const newStart = shortDateTime(startDateTime);

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

  await sendTelegramBookingNotification(bookingId, "BOOKING_RESCHEDULED", `Moved from ${oldStart} to ${newStart}`);

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
}
