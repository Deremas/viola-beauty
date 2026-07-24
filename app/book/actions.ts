"use server";

import { addMinutes } from "date-fns";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSlotAvailable, makeBookingCode } from "@/lib/booking-engine";
import { localDateTimeToUtc } from "@/lib/timezone";
import { savePaymentProof } from "@/lib/upload";
import { sendTelegramBookingAlert } from "@/lib/telegram";
import { publicBookingSchema } from "@/lib/validators/booking";

export async function createPublicBooking(formData: FormData) {
  const parsed = publicBookingSchema.parse({
    serviceId: formData.get("serviceId"),
    date: formData.get("date"),
    time: formData.get("time"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    note: formData.get("note"),
    bankAccountId: formData.get("bankAccountId"),
  });

  const service = await prisma.service.findFirst({ where: { id: parsed.serviceId, isActive: true, deletedAt: null } });
  if (!service) throw new Error("Selected service is not available");
  if (service.bookingWarningActive && String(formData.get("precautionAcknowledgement") || "") !== service.id) {
    throw new Error("Read and acknowledge the service precautions before booking");
  }
  const bankAccount = await prisma.bankAccount.findFirst({ where: { id: parsed.bankAccountId, isActive: true, deletedAt: null } });
  if (!bankAccount) throw new Error("Selected bank account is not available");

  const startDateTime = localDateTimeToUtc(parsed.date, parsed.time);
  if (startDateTime < new Date()) throw new Error("Cannot book a past slot");
  if (!(await isSlotAvailable(service.id, startDateTime))) throw new Error("This slot is no longer available");

  const bookingCode = makeBookingCode();
  const screenshotPath = await savePaymentProof(formData.get("paymentProof") as File, bookingCode);
  const endDateTime = addMinutes(startDateTime, service.durationMinutes + service.bufferMinutes);
  const precautionDocument = await prisma.precautionDocument.findFirst({ where: { isActive: true }, orderBy: { activatedAt: "desc" }, select: { id: true } });
  const precautionNoticeSnapshot = service.bookingWarningActive ? JSON.stringify({ title: service.bookingWarningTitle || service.name, intro: service.bookingWarningIntro, instructions: service.bookingWarningInstructions, contact: service.bookingWarningContact }) : null;

  const booking = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        fullName: parsed.fullName,
        phone: parsed.phone,
        email: parsed.email || null,
        note: parsed.note || null,
      },
    });

    const created = await tx.booking.create({
      data: {
        bookingCode,
        clientId: client.id,
        serviceId: service.id,
        startDateTime,
        endDateTime,
        status: "PAYMENT_UPLOADED",
        source: "ONLINE_CLIENT",
        note: parsed.note || null,
        precautionsAcknowledgedAt: service.bookingWarningActive ? new Date() : null,
        precautionNoticeSnapshot,
        precautionDocumentId: precautionDocument?.id || null,
        payment: {
          create: {
            requiredAdvanceAmount: service.advanceAmount,
            paymentStatus: "PROOF_UPLOADED",
            bankAccountId: bankAccount.id,
            screenshotPath,
          },
        },
        statusLogs: {
          create: {
            newStatus: "PAYMENT_UPLOADED",
            note: "Client uploaded payment proof",
          },
        },
      },
    });

    return created;
  });

  await sendTelegramBookingAlert(booking.id);
  redirect(`/book/success/${booking.bookingCode}`);
}
