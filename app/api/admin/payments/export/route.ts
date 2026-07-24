import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { buildPaymentWhere, paymentFiltersFromUrl } from "@/lib/payment-query";
import { shortDateTime } from "@/lib/format";

export async function GET(request: Request) {
  await requirePermission("VIEW_PAYMENTS");
  const filters = paymentFiltersFromUrl(new URL(request.url).searchParams);
  const payments = await prisma.payment.findMany({
    where: buildPaymentWhere(filters),
    include: {
      booking: { include: { client: true, service: true, bookedBy: true } },
      bankAccount: true,
      verifiedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["Booking code", "Customer", "Phone", "Service", "Appointment EAT", "Booking status", "Payment status", "Service price", "Advance required", "Paid amount", "Balance", "Bank", "Payment method", "Booked by", "Verified by", "Forfeited amount"],
    ...payments.map((payment) => {
      const paid = acceptedPaidAmount(payment);
      return [
        payment.booking.bookingCode,
        payment.booking.client.fullName,
        payment.booking.client.phone,
        payment.booking.service.name,
        shortDateTime(payment.booking.startDateTime),
        payment.booking.status,
        payment.paymentStatus,
        Number(payment.booking.service.price),
        Number(payment.requiredAdvanceAmount),
        paid,
        Math.max(0, Number(payment.booking.service.price) - paid),
        payment.bankAccount ? `${payment.bankAccount.bankName} - ${payment.bankAccount.accountNumber}` : "",
        payment.paymentMethod || "",
        payment.booking.bookedBy?.name || "Online Client",
        payment.verifiedBy?.name || "",
        Number(payment.advanceForfeitedAmount || 0),
      ];
    }),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="viola-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function acceptedPaidAmount(payment: {
  paidAmount: { toString(): string } | null;
  requiredAdvanceAmount: { toString(): string };
  paymentStatus: string;
}) {
  if (!["ADVANCE_CONFIRMED", "FULLY_PAID"].includes(payment.paymentStatus)) return 0;
  return Number(payment.paidAmount ?? payment.requiredAdvanceAmount);
}

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
