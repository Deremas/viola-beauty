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
  const paymentStatus = String(formData.get("paymentStatus") || "PROOF_UPLOADED") as "PROOF_UPLOADED" | "ADVANCE_CONFIRMED";
  const bankAccountId = String(formData.get("bankAccountId") || "");
  const proofFile = formData.get("paymentProof");
  const service = await prisma.service.findFirst({ where: { id: serviceId, isActive: true, deletedAt: null } });
  if (!service) throw new Error("Service not found");
  if (!bankAccountId) throw new Error("Choose the bank account used for payment");
  const bankAccount = await prisma.bankAccount.findFirst({ where: { id: bankAccountId, isActive: true, deletedAt: null } });
  if (!bankAccount) throw new Error("Selected bank account is not available");
  if (!(proofFile instanceof File) || proofFile.size === 0) throw new Error("Payment proof is required");
  if (!(["PROOF_UPLOADED", "ADVANCE_CONFIRMED"] as string[]).includes(paymentStatus)) throw new Error("Choose a valid payment review status");

  const startDateTime = localDateTimeToUtc(date, time);
  if (!(await isSlotAvailable(service.id, startDateTime))) throw new Error("Slot is unavailable");
  const bookingCode = makeBookingCode();
  const screenshotPath = await savePaymentProof(proofFile, bookingCode);
  const status = paymentStatus === "ADVANCE_CONFIRMED" ? "CONFIRMED" : "PAYMENT_UPLOADED";

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
          paymentStatus,
          paidAmount: paymentStatus === "ADVANCE_CONFIRMED" ? service.advanceAmount : undefined,
          paymentMethod: paymentStatus === "ADVANCE_CONFIRMED" ? "Bank transfer" : undefined,
          bankAccount: { connect: { id: bankAccount.id } },
          screenshotPath,
          verifiedBy: status === "CONFIRMED" ? { connect: { id: user.id } } : undefined,
          verifiedAt: status === "CONFIRMED" ? new Date() : null,
        },
      },
      statusLogs: { create: { newStatus: status, changedByUserId: user.id, note: "Staff booking created" } },
    },
  });

  await sendTelegramBookingNotification(
    booking.id,
    "PAYMENT_PROOF_UPLOADED",
    user.role === "RECEPTIONIST" ? `Created by receptionist ${user.name || user.id}` : "Created by admin",
  );

  redirect(`/admin/bookings/${booking.id}`);
}
