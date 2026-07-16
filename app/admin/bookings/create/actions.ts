"use server";

import { addMinutes } from "date-fns";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSlotAvailable, makeBookingCode } from "@/lib/booking-engine";
import { localDateTimeToUtc } from "@/lib/timezone";
import { requirePermission } from "@/lib/permissions";
import { savePaymentProof } from "@/lib/upload";
import { sendTelegramBookingNotification } from "@/lib/telegram";

export async function createStaffBooking(formData: FormData) {
  const user = await requirePermission("CREATE_BOOKINGS");
  const serviceId = String(formData.get("serviceId"));
  const fullName = String(formData.get("fullName"));
  const phone = String(formData.get("phone"));
  const date = String(formData.get("date"));
  const time = String(formData.get("time"));
  const paymentStatus = String(formData.get("paymentStatus") || "NOT_PAID") as "NOT_PAID" | "PROOF_UPLOADED" | "ADVANCE_CONFIRMED";
  const bankAccountId = String(formData.get("bankAccountId") || "");
  const proofFile = formData.get("paymentProof");
  const service = await prisma.service.findFirst({ where: { id: serviceId, isActive: true, deletedAt: null } });
  if (!service) throw new Error("Service not found");
  const bankAccount = bankAccountId ? await prisma.bankAccount.findFirst({ where: { id: bankAccountId, isActive: true, deletedAt: null } }) : null;
  if (bankAccountId && !bankAccount) throw new Error("Selected bank account is not available");

  const startDateTime = localDateTimeToUtc(date, time);
  if (!(await isSlotAvailable(service.id, startDateTime))) throw new Error("Slot is unavailable");
  const bookingCode = makeBookingCode();
  const hasProof = proofFile instanceof File && proofFile.size > 0;
  const screenshotPath = hasProof ? await savePaymentProof(proofFile, bookingCode) : null;
  const finalPaymentStatus = paymentStatus === "ADVANCE_CONFIRMED" ? "ADVANCE_CONFIRMED" : hasProof ? "PROOF_UPLOADED" : paymentStatus;
  const status = finalPaymentStatus === "ADVANCE_CONFIRMED" ? "CONFIRMED" : finalPaymentStatus === "PROOF_UPLOADED" ? "PAYMENT_UPLOADED" : "PENDING_PAYMENT";

  const booking = await prisma.booking.create({
    data: {
      bookingCode,
      startDateTime,
      endDateTime: addMinutes(startDateTime, service.durationMinutes + service.bufferMinutes),
      status,
      source: user.role === "ADMIN" ? "ADMIN" : "RECEPTIONIST",
      client: { create: { fullName, phone } },
      service: { connect: { id: service.id } },
      bookedBy: { connect: { id: user.id } },
      confirmedBy: status === "CONFIRMED" ? { connect: { id: user.id } } : undefined,
      payment: {
        create: {
          requiredAdvanceAmount: service.advanceAmount,
          paymentStatus: finalPaymentStatus,
          bankAccount: bankAccount ? { connect: { id: bankAccount.id } } : undefined,
          screenshotPath,
          verifiedBy: status === "CONFIRMED" ? { connect: { id: user.id } } : undefined,
          verifiedAt: status === "CONFIRMED" ? new Date() : null,
        },
      },
      statusLogs: { create: { newStatus: status, changedByUserId: user.id, note: "Staff booking created" } },
    },
  });

  if (hasProof || user.role === "RECEPTIONIST") {
    if (hasProof) {
      await sendTelegramBookingNotification(
        booking.id,
        "PAYMENT_PROOF_UPLOADED",
        user.role === "RECEPTIONIST" ? `Created by receptionist ${user.name || user.id}` : "Created by admin",
      );
    }
  }

  redirect(`/admin/bookings/${booking.id}`);
}
