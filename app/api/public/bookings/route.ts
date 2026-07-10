import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { isSlotAvailable, makeBookingCode } from "@/lib/booking-engine";
import { localDateTimeToUtc } from "@/lib/timezone";
import { savePaymentProof } from "@/lib/upload";
import { sendTelegramBookingAlert } from "@/lib/telegram";
import { publicBookingSchema } from "@/lib/validators/booking";

export async function POST(request: Request) {
  const formData = await request.formData();
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

  const service = await prisma.service.findFirst({ where: { id: parsed.serviceId, isActive: true } });
  if (!service) return Response.json({ error: "Selected service is not available" }, { status: 400 });
  const bankAccount = await prisma.bankAccount.findFirst({ where: { id: parsed.bankAccountId, isActive: true } });
  if (!bankAccount) return Response.json({ error: "Selected bank account is not available" }, { status: 400 });

  const startDateTime = localDateTimeToUtc(parsed.date, parsed.time);
  if (!(await isSlotAvailable(service.id, startDateTime))) return Response.json({ error: "Slot is unavailable" }, { status: 409 });

  const bookingCode = makeBookingCode();
  const file = formData.get("paymentProof");
  if (!(file instanceof File)) return Response.json({ error: "Payment proof is required" }, { status: 400 });
  const screenshotPath = await savePaymentProof(file, bookingCode);

  const booking = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: { fullName: parsed.fullName, phone: parsed.phone, email: parsed.email || null, note: parsed.note || null },
    });

    return tx.booking.create({
      data: {
        bookingCode,
        clientId: client.id,
        serviceId: service.id,
        startDateTime,
        endDateTime: addMinutes(startDateTime, service.durationMinutes + service.bufferMinutes),
        status: "PAYMENT_UPLOADED",
        source: "ONLINE_CLIENT",
        note: parsed.note || null,
        payment: {
          create: {
            requiredAdvanceAmount: service.advanceAmount,
            paymentStatus: "PROOF_UPLOADED",
            bankAccountId: bankAccount.id,
            screenshotPath,
          },
        },
        statusLogs: { create: { newStatus: "PAYMENT_UPLOADED", note: "Client uploaded payment proof" } },
      },
    });
  });

  await sendTelegramBookingAlert(booking.id);
  return Response.json({ bookingCode: booking.bookingCode });
}
