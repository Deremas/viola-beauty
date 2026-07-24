"use server";

import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";
import { isSlotAvailable } from "@/lib/booking-engine";
import { prisma } from "@/lib/prisma";
import { canConfirmPayment, requirePermission, requireUser } from "@/lib/permissions";
import { localDateTimeToUtc } from "@/lib/timezone";
import { sendTelegramBookingNotification } from "@/lib/telegram";
import { shortDateTime } from "@/lib/format";
import { sendClientBookingSms } from "@/lib/sms";

async function changeStatus(bookingId: string, newStatus: "CANCELLED" | "COMPLETED") {
  const user = await requirePermission("MANAGE_BOOKINGS");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
  if (!booking) throw new Error("Booking not found");
  if (["CANCELLED", "COMPLETED", "REJECTED", "EXPIRED", "NO_SHOW"].includes(booking.status)) {
    throw new Error("This booking is already closed and cannot be changed");
  }
  if (newStatus === "COMPLETED" && booking.payment?.paymentStatus !== "FULLY_PAID") {
    throw new Error("Record full payment before completing this booking");
  }
  if (newStatus === "COMPLETED" && booking.status !== "CONFIRMED") {
    throw new Error("Only a confirmed booking can be completed");
  }
  if (newStatus === "COMPLETED" && booking.startDateTime.getTime() > Date.now()) {
    throw new Error("Wait until the appointment start time before marking it completed");
  }
  if (newStatus === "CANCELLED" && booking.status === "CONFIRMED" && booking.startDateTime.getTime() <= Date.now()) {
    throw new Error("A past confirmed appointment cannot be cancelled. Mark it completed or no-show");
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
  }[newStatus] as "BOOKING_CANCELLED" | "BOOKING_COMPLETED";
  await sendTelegramBookingNotification(bookingId, event);
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function confirmPayment(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  const user = await requireUser();
  if (!canConfirmPayment(user)) throw new Error("Forbidden");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true, service: true } });
  if (!booking || !booking.payment) throw new Error("Booking not found");
  if (["CANCELLED", "COMPLETED", "REJECTED", "EXPIRED", "NO_SHOW"].includes(booking.status)) {
    throw new Error("Payment cannot be reviewed for a closed booking");
  }
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
  if (!canConfirmPayment(user)) throw new Error("Forbidden");
  if (!Number.isFinite(additionalAmount) || additionalAmount <= 0) throw new Error("Enter a positive payment amount");
  if (!paymentMethod) throw new Error("Choose a payment method");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, service: true },
  });
  if (!booking?.payment) throw new Error("Booking payment not found");
  if (["CANCELLED", "COMPLETED", "REJECTED", "EXPIRED", "NO_SHOW"].includes(booking.status)) {
    throw new Error("Payment cannot be changed for a closed booking");
  }
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
  if (!canConfirmPayment(user)) throw new Error("Forbidden");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
  if (!booking || !booking.payment) throw new Error("Booking not found");
  if (["CANCELLED", "COMPLETED", "REJECTED", "EXPIRED", "NO_SHOW"].includes(booking.status)) {
    throw new Error("Payment cannot be rejected for a closed booking");
  }

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
  const bookingId = String(formData.get("bookingId"));
  const user = await requirePermission("MANAGE_BOOKINGS");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
  if (!booking?.payment) throw new Error("Booking payment not found");
  if (booking.status !== "CONFIRMED") throw new Error("Only a confirmed booking can be marked as a no-show");
  if (booking.startDateTime.getTime() > Date.now()) throw new Error("Wait until the appointment start time before marking a no-show");
  if (!["ADVANCE_CONFIRMED", "FULLY_PAID"].includes(booking.payment.paymentStatus)) {
    throw new Error("The advance payment must be confirmed before marking a no-show");
  }

  const forfeitedAmount = Number(booking.payment.requiredAdvanceAmount);
  const now = new Date();
  const note = `Marked as no-show. Advance of ${forfeitedAmount} ETB forfeited; it is non-refundable and cannot be moved to another booking.`;

  await prisma.$transaction([
    prisma.booking.update({ where: { id: bookingId }, data: { status: "EXPIRED" } }),
    prisma.payment.update({
      where: { bookingId },
      data: {
        advanceForfeitedAmount: forfeitedAmount,
        advanceForfeitedAt: now,
        advanceForfeitedByUserId: user.id,
      },
    }),
    prisma.bookingStatusLog.create({
      data: { bookingId, oldStatus: booking.status, newStatus: "EXPIRED", changedByUserId: user.id, note },
    }),
  ]);

  await sendTelegramBookingNotification(bookingId, "BOOKING_NO_SHOW", note);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
}

export async function rescheduleBooking(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const user = await requirePermission("MANAGE_BOOKINGS");

  if (!date || !time) throw new Error("Choose a new date and time");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });
  if (!booking) throw new Error("Booking not found");
  if (["CANCELLED", "COMPLETED", "REJECTED", "EXPIRED", "NO_SHOW"].includes(booking.status)) {
    throw new Error("A closed booking cannot be rescheduled. Create a new booking instead");
  }
  if (booking.status === "CONFIRMED" && booking.startDateTime.getTime() <= Date.now()) {
    throw new Error("A past confirmed appointment cannot be rescheduled. Mark it completed or no-show");
  }

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
