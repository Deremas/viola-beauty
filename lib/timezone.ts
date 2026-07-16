import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

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
