export function parseMoneyToCents(value: string | null | undefined) {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
}

export function centsToDecimalString(cents: number) {
  const absolute = Math.abs(Math.trunc(cents));
  const sign = cents < 0 ? "-" : "";
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

export function decimalToCents(value: { toString(): string } | string | number | null | undefined) {
  if (value == null) return null;
  const raw = typeof value === "number" ? value.toFixed(2) : value.toString();
  return parseMoneyToCents(raw);
}

export function netCents(agreedCents: number | null, discountCents: number) {
  if (agreedCents == null) return null;
  return agreedCents - discountCents;
}

export type LedgerRow = {
  amountCents: number;
  type: "PAYMENT" | "REFUND" | "REVERSAL";
  status: "PENDING" | "VERIFIED" | "REJECTED";
};

export type PaymentStanding = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED" | "OVERDUE";

export function summarizeLedger(rows: LedgerRow[], netFee: number | null) {
  let paidCents = 0;
  let returnedCents = 0;
  for (const row of rows) {
    if (row.status !== "VERIFIED" || row.amountCents <= 0) continue;
    if (row.type === "PAYMENT") paidCents += row.amountCents;
    else returnedCents += row.amountCents;
  }
  const verifiedNetCents = paidCents - returnedCents;
  const outstandingCents = netFee == null ? null : Math.max(0, netFee - verifiedNetCents);
  let standing: PaymentStanding = "UNPAID";
  if (paidCents > 0 && returnedCents >= paidCents && verifiedNetCents <= 0) standing = "REFUNDED";
  else if (netFee != null && netFee > 0 && verifiedNetCents >= netFee) standing = "PAID";
  else if (verifiedNetCents > 0) standing = "PARTIALLY_PAID";
  return { paidCents, returnedCents, verifiedNetCents, outstandingCents, standing };
}

export function applyOverdue(standing: PaymentStanding, overdue: boolean): PaymentStanding {
  if (!overdue) return standing;
  if (standing === "PAID" || standing === "REFUNDED") return standing;
  return "OVERDUE";
}

export function isCourseOverdue(input: {
  expectedStartDate: Date | null;
  registrationStatus: string;
  outstandingCents: number | null;
  now?: Date;
}) {
  if (!input.expectedStartDate) return false;
  if (input.registrationStatus !== "APPROVED" && input.registrationStatus !== "CONFIRMED") return false;
  if (input.outstandingCents == null || input.outstandingCents <= 0) return false;
  const now = input.now ?? new Date();
  return input.expectedStartDate.getTime() < now.getTime();
}
