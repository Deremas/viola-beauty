import { addDays, addMinutes, isBefore } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appDate, appDayOfWeek, appTime, appTimezone, localDateTimeToUtc } from "@/lib/timezone";

const blockingStatuses = [BookingStatus.PAYMENT_UPLOADED, BookingStatus.CONFIRMED];

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
}

async function isWithinConfiguredAvailability(startDateTime: Date, serviceDurationMinutes: number) {
  const date = appDate(startDateTime);
  const { day, dayEnd } = getStoredDateRange(date);
  const dayOfWeek = appDayOfWeek(startDateTime);
  const workingHour = await prisma.workingHour.findUnique({ where: { dayOfWeek } });

  if (!workingHour || !workingHour.isOpen) return false;

  const slotStart = timeToMinutes(appTime(startDateTime));
  const slotEnd = slotStart + serviceDurationMinutes;
  const opening = timeToMinutes(workingHour.openingTime);
  const closing = timeToMinutes(workingHour.closingTime);

  if (slotStart < opening || slotEnd > closing) return false;

  const [fullDayOff, partialDaysOff, breakTimes] = await Promise.all([
    prisma.dayOff.findFirst({
      where: {
        date: { gte: day, lt: dayEnd },
        isFullDay: true,
      },
    }),
    prisma.dayOff.findMany({
      where: {
        date: { gte: day, lt: dayEnd },
        isFullDay: false,
      },
    }),
    prisma.breakTime.findMany({
      where: {
        dayOfWeek,
        isActive: true,
      },
    }),
  ]);

  if (fullDayOff) return false;

  const isInPartialDayOff = partialDaysOff.some((dayOff) => {
    if (!dayOff.startTime || !dayOff.endTime) return false;
    return rangesOverlap(slotStart, slotEnd, timeToMinutes(dayOff.startTime), timeToMinutes(dayOff.endTime));
  });
  if (isInPartialDayOff) return false;

  return !breakTimes.some((breakTime) =>
    rangesOverlap(slotStart, slotEnd, timeToMinutes(breakTime.startTime), timeToMinutes(breakTime.endTime)),
  );
}

export async function isSlotAvailable(serviceId: string, startDateTime: Date, bookingIdToIgnore?: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) return false;

  if (!isBefore(new Date(), startDateTime)) return false;
  if (!(await isWithinConfiguredAvailability(startDateTime, service.durationMinutes))) return false;

  const endDateTime = addMinutes(startDateTime, service.durationMinutes + service.bufferMinutes);
  const overlap = await prisma.booking.findFirst({
    where: {
      id: bookingIdToIgnore ? { not: bookingIdToIgnore } : undefined,
      status: { in: blockingStatuses },
      startDateTime: { lt: endDateTime },
      endDateTime: { gt: startDateTime },
    },
  });

  return !overlap;
}

export async function getAvailableSlots(serviceId: string, date: string) {
  const slots = await getSlotAvailability(serviceId, date);
  return slots.filter((slot) => slot.isAvailable).map((slot) => slot.time);
}

export async function getSlotAvailability(serviceId: string, date: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) return [];

  const { day, dayEnd } = getStoredDateRange(date);
  const dayOfWeek = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  const workingHour = await prisma.workingHour.findUnique({ where: { dayOfWeek } });
  if (!workingHour || !workingHour.isOpen) return [];

  const fullDayOff = await prisma.dayOff.findFirst({
    where: {
      date: {
        gte: day,
        lt: dayEnd,
      },
      isFullDay: true,
    },
  });
  if (fullDayOff) return [];

  const [partialDaysOff, breakTimes] = await Promise.all([
    prisma.dayOff.findMany({
      where: {
        date: {
          gte: day,
          lt: dayEnd,
        },
        isFullDay: false,
      },
    }),
    prisma.breakTime.findMany({
      where: {
        dayOfWeek,
        isActive: true,
      },
    }),
  ]);

  let cursor = localDateTimeToUtc(date, workingHour.openingTime);
  const close = localDateTimeToUtc(date, workingHour.closingTime);
  const stepMinutes = Math.max(15, service.durationMinutes + service.bufferMinutes);
  const slots: Array<{ time: string; isAvailable: boolean; reason?: string }> = [];

  while (!isBefore(close, addMinutes(cursor, service.durationMinutes))) {
    const isPast = !isBefore(new Date(), cursor);
    const slotStart = timeToMinutes(appTime(cursor));
    const slotEnd = slotStart + service.durationMinutes;
    const isInBreak = breakTimes.some((breakTime) =>
      rangesOverlap(slotStart, slotEnd, timeToMinutes(breakTime.startTime), timeToMinutes(breakTime.endTime)),
    );
    const isInPartialDayOff = partialDaysOff.some((dayOff) => {
      if (!dayOff.startTime || !dayOff.endTime) return false;
      return rangesOverlap(slotStart, slotEnd, timeToMinutes(dayOff.startTime), timeToMinutes(dayOff.endTime));
    });
    const hasSpace = await isSlotAvailable(serviceId, cursor);
    slots.push({
      time: appTime(cursor),
      isAvailable: !isPast && !isInBreak && !isInPartialDayOff && hasSpace,
      reason: isPast
        ? "Past time"
        : isInBreak
          ? "Break time"
          : isInPartialDayOff
            ? "Day off"
            : hasSpace
              ? undefined
              : "Already booked",
    });
    cursor = addMinutes(cursor, stepMinutes);
  }

  return slots;
}

function getStoredDateRange(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`);
  return { day, dayEnd: addDays(day, 1) };
}

export function makeBookingCode() {
  const now = new Date();
  const stamp = formatInTimeZone(now, appTimezone, "yyMMdd");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `VB-${stamp}-${suffix}`;
}
