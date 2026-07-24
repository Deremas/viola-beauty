import { addMinutes, addHours } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isSlotAvailable, makeBookingCode } from "@/lib/booking-engine";
import { localDateTimeToUtc } from "@/lib/timezone";
import { savePaymentProof } from "@/lib/upload";
import { sendTelegramBookingAlert } from "@/lib/telegram";
import { publicBookingSchema } from "@/lib/validators/booking";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { consumeRateLimit, securitySettings } from "@/lib/rate-limit";
import { getRequestIp, requestFingerprint, securityHash } from "@/lib/security";

export class PublicBookingError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) {
    super(message);
    this.name = "PublicBookingError";
  }
}

export async function createPublicBookingRecord(formData: FormData, requestHeaders: Headers) {
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
  const token = String(formData.get("submissionToken") || "").trim();
  if (token.length < 24 || token.length > 200) throw new PublicBookingError("INVALID_SUBMISSION_TOKEN", "Refresh the booking page and try again.");

  const normalizedPhone = normalizeEthiopianPhone(parsed.phone);
  if (!normalizedPhone) throw new PublicBookingError("INVALID_PHONE", "Enter a valid Ethiopian mobile number.");
  const tokenHash = securityHash(`booking-token:${token}`);
  const phoneHash = securityHash(`booking-phone:${normalizedPhone}`);
  const fingerprint = requestFingerprint([
    parsed.serviceId, parsed.date, parsed.time, parsed.fullName.toLowerCase(), normalizedPhone,
    parsed.email?.toLowerCase(), parsed.bankAccountId, String(formData.get("precautionAcknowledgement") || ""),
  ]);

  const existing = await prisma.bookingSubmission.findUnique({
    where: { tokenHash },
    include: { booking: { select: { id: true, bookingCode: true } } },
  });
  const recovered = resolveExisting(existing, fingerprint);
  if (recovered) return recovered;

  const settings = await securitySettings();
  await Promise.all([
    consumeRateLimit({ action: "public-booking-ip", identifier: getRequestIp(requestHeaders), limit: settings.bookingIpMax, windowSeconds: settings.bookingWindowSeconds }),
    consumeRateLimit({ action: "public-booking-phone", identifier: normalizedPhone, limit: settings.bookingPhoneMax, windowSeconds: settings.bookingWindowSeconds }),
  ]);

  try {
    await prisma.bookingSubmission.create({
      data: {
        tokenHash,
        phoneHash,
        requestFingerprint: fingerprint,
        status: "PROCESSING",
        expiresAt: addHours(new Date(), 24),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await prisma.bookingSubmission.findUnique({ where: { tokenHash }, include: { booking: { select: { id: true, bookingCode: true } } } });
      const result = resolveExisting(raced, fingerprint);
      if (result) return result;
      throw new PublicBookingError("SUBMISSION_PROCESSING", "Your booking request is still processing. Please wait before trying again.", 409);
    }
    throw error;
  }

  try {
    const [service, bankAccount, precautionDocument] = await Promise.all([
      prisma.service.findFirst({ where: { id: parsed.serviceId, isActive: true, deletedAt: null } }),
      prisma.bankAccount.findFirst({ where: { id: parsed.bankAccountId, isActive: true, deletedAt: null } }),
      prisma.precautionDocument.findFirst({ where: { isActive: true }, orderBy: { activatedAt: "desc" }, select: { id: true } }),
    ]);
    if (!service) throw new PublicBookingError("SERVICE_UNAVAILABLE", "The selected service is no longer available.");
    if (!bankAccount) throw new PublicBookingError("BANK_UNAVAILABLE", "The selected bank account is no longer available.");
    if (service.bookingWarningActive && String(formData.get("precautionAcknowledgement") || "") !== service.id) {
      throw new PublicBookingError("PRECAUTIONS_REQUIRED", "Read and acknowledge the service precautions before booking.");
    }

    const startDateTime = localDateTimeToUtc(parsed.date, parsed.time);
    if (startDateTime <= new Date()) throw new PublicBookingError("PAST_SLOT", "Choose a future appointment time.");
    if (!(await isSlotAvailable(service.id, startDateTime))) {
      throw new PublicBookingError("SLOT_TAKEN", "This appointment time was just booked. Please choose another available time.", 409);
    }

    const file = formData.get("paymentProof");
    if (!(file instanceof File) || file.size === 0) throw new PublicBookingError("PROOF_REQUIRED", "Payment proof is required.");
    const bookingCode = makeBookingCode();
    const screenshotPath = await savePaymentProof(file, bookingCode);
    const precautionNoticeSnapshot = service.bookingWarningActive
      ? JSON.stringify({ title: service.bookingWarningTitle || service.name, intro: service.bookingWarningIntro, instructions: service.bookingWarningInstructions, contact: service.bookingWarningContact })
      : null;

    const booking = await prisma.$transaction(async (tx) => {
      const candidates = await tx.client.findMany({ where: { phone: { contains: normalizedPhone.slice(-8) } }, take: 20 });
      const matchingClient = candidates.find((client) => normalizeEthiopianPhone(client.phone) === normalizedPhone);
      const client = matchingClient
        ? await tx.client.update({ where: { id: matchingClient.id }, data: { fullName: parsed.fullName, phone: normalizedPhone, email: parsed.email || matchingClient.email, note: parsed.note || matchingClient.note } })
        : await tx.client.create({ data: { fullName: parsed.fullName, phone: normalizedPhone, email: parsed.email || null, note: parsed.note || null } });

      const created = await tx.booking.create({
        data: {
          bookingCode,
          clientId: client.id,
          serviceId: service.id,
          startDateTime,
          endDateTime: addMinutes(startDateTime, service.durationMinutes + service.bufferMinutes),
          status: "PAYMENT_UPLOADED",
          source: "ONLINE_CLIENT",
          note: parsed.note || null,
          precautionsAcknowledgedAt: service.bookingWarningActive ? new Date() : null,
          precautionNoticeSnapshot,
          precautionDocumentId: precautionDocument?.id || null,
          payment: { create: { requiredAdvanceAmount: service.advanceAmount, paymentStatus: "PROOF_UPLOADED", bankAccountId: bankAccount.id, screenshotPath } },
          statusLogs: { create: { newStatus: "PAYMENT_UPLOADED", note: "Client uploaded payment proof" } },
        },
      });
      await tx.bookingSubmission.update({
        where: { tokenHash },
        data: { status: "COMPLETED", bookingId: created.id, completedAt: new Date(), lastAttemptedAt: new Date(), lastErrorCode: null },
      });
      return created;
    });

    // A notification outage must never turn a successfully saved booking into a failed submission.
    await sendTelegramBookingAlert(booking.id).catch((error) => {
      console.error("Telegram booking alert failed", error);
    });
    return { bookingCode: booking.bookingCode, bookingId: booking.id, recovered: false };
  } catch (error) {
    const code = error instanceof PublicBookingError
      ? error.code
      : String(error).includes("no_overlapping_active_bookings") ? "SLOT_TAKEN" : "BOOKING_FAILED";
    await prisma.bookingSubmission.updateMany({
      where: { tokenHash, status: "PROCESSING" },
      data: { status: "FAILED", lastErrorCode: code, lastAttemptedAt: new Date(), attemptCount: { increment: 1 } },
    });
    if (code === "SLOT_TAKEN" && !(error instanceof PublicBookingError)) {
      throw new PublicBookingError("SLOT_TAKEN", "This appointment time was just booked. Please choose another available time.", 409);
    }
    throw error;
  }
}

function resolveExisting(existing: {
  requestFingerprint: string;
  status: string;
  createdAt: Date;
  booking: { id: string; bookingCode: string } | null;
} | null, fingerprint: string) {
  if (!existing) return null;
  if (existing.requestFingerprint !== fingerprint) {
    throw new PublicBookingError("TOKEN_REUSED", "This booking form has changed. Refresh the page before submitting again.", 409);
  }
  if (existing.status === "COMPLETED" && existing.booking) {
    return { bookingCode: existing.booking.bookingCode, bookingId: existing.booking.id, recovered: true };
  }
  if (existing.status === "PROCESSING" && Date.now() - existing.createdAt.getTime() < 120_000) {
    throw new PublicBookingError("SUBMISSION_PROCESSING", "Your booking request is still processing. Please wait before trying again.", 409);
  }
  throw new PublicBookingError("SUBMISSION_FAILED", "The previous request did not finish. Refresh the booking page to safely try again.", 409);
}
