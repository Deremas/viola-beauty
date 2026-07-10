export const appTimezone = process.env.APP_TIMEZONE || "Africa/Addis_Ababa";

export function localDateTimeToUtc(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}
