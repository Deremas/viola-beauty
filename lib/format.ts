import { formatInTimeZone } from "date-fns-tz";
import { appTimezone } from "@/lib/timezone";

export function money(value: number | { toString(): string }) {
  return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })} ETB`;
}

export function shortDateTime(value: Date) {
  return `${formatInTimeZone(value, appTimezone, "EEE, MMM d, yyyy, h:mm a")} EAT`;
}

export function formatDuration(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} min`;
}

export function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
