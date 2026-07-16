export function money(value: number | { toString(): string }) {
  return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })} ETB`;
}

export function shortDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: appTimezone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
import { appTimezone } from "@/lib/timezone";
