import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { addDays } from "date-fns";

export const appTimezone = process.env.APP_TIMEZONE || "Africa/Addis_Ababa";

export function localDateTimeToUtc(date: string, time: string) {
  return fromZonedTime(`${date}T${time}:00`, appTimezone);
}

export function appDate(value: Date) {
  return formatInTimeZone(value, appTimezone, "yyyy-MM-dd");
}

export function appTime(value: Date) {
  return formatInTimeZone(value, appTimezone, "HH:mm");
}

export function appDayOfWeek(value: Date) {
  const isoDay = Number(formatInTimeZone(value, appTimezone, "i"));
  return isoDay % 7;
}

export function appDateRange(date: string) {
  const start = localDateTimeToUtc(date, "00:00");
  return { start, end: addDays(start, 1) };
}

export function calendarLocalIso(value: Date) {
  return formatInTimeZone(value, appTimezone, "yyyy-MM-dd'T'HH:mm:ss");
}

export function calendarRangeToUtc(value: string) {
  const parsed = new Date(value);
  const calendarWallTime = parsed.toISOString().slice(0, 19);
  return fromZonedTime(calendarWallTime, appTimezone);
}
