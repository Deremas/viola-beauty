import { addDays, addHours, setHours, setMinutes } from "date-fns";
import { PrismaClient, type BookingSource, type BookingStatus, type PaymentStatus, type UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { servicePrecautionDefaults } from "../lib/service-precaution-defaults";

const prisma = new PrismaClient();

function atDayTime(daysFromNow: number, hour: number, minute = 0) {
  const day = addDays(new Date(), daysFromNow);
  return setMinutes(setHours(day, hour), minute);
}

async function upsertUser(input: {
  name: string;
  username: string;
  phone: string;
  password: string;
  role: UserRole;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.upsert({
    where: { username: input.username },
    update: {
      name: input.name,
      phone: input.phone,
      passwordHash,
      role: input.role,
      isActive: true,
    },
    create: {
      name: input.name,
      username: input.username,
      phone: input.phone,
      passwordHash,
      role: input.role,
      isActive: true,
    },
  });
}

async function upsertSampleBooking(input: {
  bookingCode: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  startDateTime: Date;
  durationHours: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  source: BookingSource;
  bookedByUserId?: string;
  confirmedByUserId?: string;
  bankAccountId?: string;
  requiredAdvanceAmount: number;
  paidAmount?: number;
  note?: string;
}) {
  const existing = await prisma.booking.findUnique({ where: { bookingCode: input.bookingCode } });
  if (existing) {
    return prisma.booking.update({
      where: { bookingCode: input.bookingCode },
      data: {
        startDateTime: input.startDateTime,
        endDateTime: addHours(input.startDateTime, input.durationHours),
        status: input.status,
        source: input.source,
        bookedByUserId: input.bookedByUserId,
        confirmedByUserId: input.confirmedByUserId,
        note: input.note,
        payment: {
          upsert: {
            update: {
              requiredAdvanceAmount: input.requiredAdvanceAmount,
              paidAmount: input.paidAmount,
              paymentStatus: input.paymentStatus,
              bankAccountId: input.bankAccountId,
              verifiedByUserId: input.confirmedByUserId,
              verifiedAt: input.confirmedByUserId ? new Date() : null,
            },
            create: {
              requiredAdvanceAmount: input.requiredAdvanceAmount,
              paidAmount: input.paidAmount,
              paymentStatus: input.paymentStatus,
              bankAccountId: input.bankAccountId,
              verifiedByUserId: input.confirmedByUserId,
              verifiedAt: input.confirmedByUserId ? new Date() : null,
              screenshotPath: `payment-proof/${input.bookingCode}-sample.png`,
            },
          },
        },
      },
    });
  }

  return prisma.booking.create({
    data: {
      bookingCode: input.bookingCode,
      client: {
        create: {
          fullName: input.clientName,
          phone: input.clientPhone,
        },
      },
      service: { connect: { id: input.serviceId } },
      startDateTime: input.startDateTime,
      endDateTime: addHours(input.startDateTime, input.durationHours),
      status: input.status,
      source: input.source,
      bookedBy: input.bookedByUserId ? { connect: { id: input.bookedByUserId } } : undefined,
      confirmedBy: input.confirmedByUserId ? { connect: { id: input.confirmedByUserId } } : undefined,
      note: input.note,
      payment: {
        create: {
          requiredAdvanceAmount: input.requiredAdvanceAmount,
          paidAmount: input.paidAmount,
          paymentStatus: input.paymentStatus,
          bankAccount: input.bankAccountId ? { connect: { id: input.bankAccountId } } : undefined,
          verifiedBy: input.confirmedByUserId ? { connect: { id: input.confirmedByUserId } } : undefined,
          verifiedAt: input.confirmedByUserId ? new Date() : null,
          screenshotPath: `payment-proof/${input.bookingCode}-sample.png`,
        },
      },
      statusLogs: {
        create: {
          newStatus: input.status,
          changedBy: input.bookedByUserId ? { connect: { id: input.bookedByUserId } } : undefined,
          note: "Seed sample booking",
        },
      },
    },
  });
}

async function main() {
  await prisma.bookingSetting.upsert({
    where: { id: "primary" },
    update: {},
    create: { id: "primary", slotIntervalMinutes: 60 },
  });

  const admin = await upsertUser({
    name: "Viola Admin",
    username: "admin",
    phone: "1234",
    password: "1234",
    role: "ADMIN",
  });

  const receptionist = await upsertUser({
    name: "Viola Reception",
    username: "receptionist",
    phone: "1234",
    password: "1234",
    role: "RECEPTIONIST",
  });

  const services = [
    ["ombre-brows", "Ombre Brows", "Brows", "Soft powdered brow finish.", 8500, 2000, 150, 15],
    ["nano-brows", "Nano Brows", "Brows", "Natural hair-stroke brow enhancement.", 9500, 2500, 180, 15],
    ["lip-blush", "Lip Blush", "Lips", "Subtle lip color correction and definition.", 9000, 2500, 180, 20],
    ["brow-lamination", "Brow Lamination", "Brows", "Lifted, groomed brows with shaping.", 2200, 700, 60, 10],
    ["lash-lift", "Lash Lift", "Lashes", "Lifted lashes with clean curl and definition.", 1800, 500, 60, 10],
    ["consultation", "Consultation", "Planning", "Shape, color, and treatment planning session.", 700, 300, 30, 0],
  ] as const;

  for (const [id, name, category, description, price, advanceAmount, durationMinutes, bufferMinutes] of services) {
    const warning = servicePrecautionDefaults[name.toLowerCase()];
    await prisma.service.upsert({
      where: { id },
      update: {
        name,
        category,
        description,
        price,
        advanceAmount,
        durationMinutes,
        bufferMinutes,
        bookingWarningTitle: warning?.title,
        bookingWarningIntro: warning?.intro,
        bookingWarningInstructions: warning?.instructions,
        bookingWarningContact: warning?.contact,
        bookingWarningActive: Boolean(warning),
        isActive: true,
      },
      create: {
        id,
        name,
        category,
        description,
        price,
        advanceAmount,
        durationMinutes,
        bufferMinutes,
        bookingWarningTitle: warning?.title,
        bookingWarningIntro: warning?.intro,
        bookingWarningInstructions: warning?.instructions,
        bookingWarningContact: warning?.contact,
        bookingWarningActive: Boolean(warning),
        isActive: true,
      },
    });
  }

  for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek++) {
    await prisma.workingHour.upsert({
      where: { dayOfWeek },
      update: {
        openingTime: "09:00",
        closingTime: dayOfWeek === 6 ? "17:00" : "18:00",
        isOpen: true,
      },
      create: {
        dayOfWeek,
        openingTime: "09:00",
        closingTime: dayOfWeek === 6 ? "17:00" : "18:00",
        isOpen: true,
      },
    });
  }

  await prisma.workingHour.upsert({
    where: { dayOfWeek: 0 },
    update: { openingTime: "09:00", closingTime: "18:00", isOpen: false },
    create: { dayOfWeek: 0, openingTime: "09:00", closingTime: "18:00", isOpen: false },
  });

  const primaryBank = await prisma.bankAccount.upsert({
    where: { id: "primary-bank" },
    update: {
      bankName: "Commercial Bank of Ethiopia",
      accountName: "Viola Brows and Beauty",
      accountNumber: "1000XXXXXX",
      instructions: "Use your booking name as the transfer reference.",
      isActive: true,
    },
    create: {
      id: "primary-bank",
      bankName: "Commercial Bank of Ethiopia",
      accountName: "Viola Brows and Beauty",
      accountNumber: "1000XXXXXX",
      instructions: "Use your booking name as the transfer reference.",
      isActive: true,
    },
  });

  await prisma.bankAccount.upsert({
    where: { id: "secondary-bank" },
    update: {
      bankName: "Awash Bank",
      accountName: "Viola Brows and Beauty",
      accountNumber: "0132XXXXXX",
      instructions: "Upload a clear screenshot after transfer.",
      isActive: true,
    },
    create: {
      id: "secondary-bank",
      bankName: "Awash Bank",
      accountName: "Viola Brows and Beauty",
      accountNumber: "0132XXXXXX",
      instructions: "Upload a clear screenshot after transfer.",
      isActive: true,
    },
  });

  await prisma.dayOff.upsert({
    where: { id: "training-day" },
    update: {
      title: "Closed for training",
      date: atDayTime(14, 0),
      isFullDay: true,
      note: "Sample unavailable day",
    },
    create: {
      id: "training-day",
      title: "Closed for training",
      date: atDayTime(14, 0),
      isFullDay: true,
      note: "Sample unavailable day",
    },
  });

  await prisma.breakTime.upsert({
    where: { id: "weekday-lunch-break" },
    update: {
      dayOfWeek: 1,
      startTime: "13:00",
      endTime: "14:00",
      isActive: true,
    },
    create: {
      id: "weekday-lunch-break",
      dayOfWeek: 1,
      startTime: "13:00",
      endTime: "14:00",
      isActive: true,
    },
  });

  await upsertSampleBooking({
    bookingCode: "VB-SAMPLE-1001",
    clientName: "Sara Alemu",
    clientPhone: "0911000001",
    serviceId: "ombre-brows",
    startDateTime: atDayTime(1, 10),
    durationHours: 3,
    status: "PAYMENT_UPLOADED",
    paymentStatus: "PROOF_UPLOADED",
    source: "ONLINE_CLIENT",
    bankAccountId: primaryBank.id,
    requiredAdvanceAmount: 2000,
    note: "Waiting for admin verification",
  });

  await upsertSampleBooking({
    bookingCode: "VB-SAMPLE-1002",
    clientName: "Hana Bekele",
    clientPhone: "0922000002",
    serviceId: "brow-lamination",
    startDateTime: atDayTime(2, 14),
    durationHours: 1,
    status: "CONFIRMED",
    paymentStatus: "ADVANCE_CONFIRMED",
    source: "RECEPTIONIST",
    bookedByUserId: receptionist.id,
    confirmedByUserId: admin.id,
    bankAccountId: primaryBank.id,
    requiredAdvanceAmount: 700,
    paidAmount: 700,
  });

  await upsertSampleBooking({
    bookingCode: "VB-SAMPLE-1003",
    clientName: "Liya Tesfaye",
    clientPhone: "0933000003",
    serviceId: "lip-blush",
    startDateTime: atDayTime(3, 11),
    durationHours: 3,
    status: "COMPLETED",
    paymentStatus: "FULLY_PAID",
    source: "ADMIN",
    bookedByUserId: admin.id,
    confirmedByUserId: admin.id,
    bankAccountId: primaryBank.id,
    requiredAdvanceAmount: 2500,
    paidAmount: 9000,
  });

  await upsertSampleBooking({
    bookingCode: "VB-SAMPLE-1004",
    clientName: "Mimi Dawit",
    clientPhone: "0944000004",
    serviceId: "nano-brows",
    startDateTime: atDayTime(4, 9),
    durationHours: 3,
    status: "CANCELLED",
    paymentStatus: "PAYMENT_REJECTED",
    source: "ONLINE_CLIENT",
    bankAccountId: primaryBank.id,
    requiredAdvanceAmount: 2500,
    note: "Sample cancelled booking",
  });

  await prisma.notificationLog.upsert({
    where: { id: "sample-telegram-log" },
    update: {
      channel: "TELEGRAM",
      recipient: "sample-admin-chat",
      message: "Sample booking payment uploaded notification",
      status: "sent",
      sentAt: new Date(),
    },
    create: {
      id: "sample-telegram-log",
      channel: "TELEGRAM",
      recipient: "sample-admin-chat",
      message: "Sample booking payment uploaded notification",
      status: "sent",
      sentAt: new Date(),
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
