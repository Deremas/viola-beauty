import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { appDate, localDateTimeToUtc } from "@/lib/timezone";
import { centsToDecimalString, decimalToCents, netCents, summarizeLedger } from "@/lib/courses/money";

function csv(rows: string[][]) {
  const lines = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  return new Response(`\uFEFF${lines.join("\n")}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=course-report.csv" },
  });
}

function range(url: URL) {
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const course = url.searchParams.get("course") || "";
  const registration = url.searchParams.get("registration") || "";
  return {
    ...(course ? { courseId: course } : {}),
    ...(registration ? { registrationStatus: registration as never } : {}),
    ...((/^\d{4}-\d{2}-\d{2}$/.test(from) || /^\d{4}-\d{2}-\d{2}$/.test(to))
      ? {
          registeredAt: {
            ...( /^\d{4}-\d{2}-\d{2}$/.test(from) ? { gte: localDateTimeToUtc(from, "00:00") } : {}),
            ...( /^\d{4}-\d{2}-\d{2}$/.test(to) ? { lt: addDays(localDateTimeToUtc(to, "00:00"), 1) } : {}),
          },
        }
      : {}),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const where = range(url);
  if (url.searchParams.get("kind") === "payments") {
    await requirePermission("EXPORT_COURSE_PAYMENTS");
    const payments = await prisma.coursePayment.findMany({
      where: { registration: where },
      include: { registration: { include: { student: true, course: true } } },
      orderBy: { paidAt: "desc" },
      take: 5000,
    });
    return csv([
      ["Date", "Reference", "Student", "Course", "Type", "Method", "Amount", "Status", "Transaction"],
      ...payments.map((payment) => [
        appDate(payment.paidAt),
        payment.registration.registrationNumber,
        payment.registration.student.fullName,
        payment.registration.course.name,
        payment.ledgerType,
        payment.method,
        payment.amount.toString(),
        payment.verificationStatus,
        payment.transactionReference || "",
      ]),
    ]);
  }

  await requirePermission("EXPORT_REGISTRATIONS");
  const registrations = await prisma.courseRegistration.findMany({
    where,
    include: { student: true, course: true, payments: { select: { amount: true, ledgerType: true, verificationStatus: true } } },
    orderBy: { registeredAt: "desc" },
    take: 5000,
  });
  return csv([
    ["Reference", "Student", "Phone", "Course", "Intake", "Registered", "Registration", "Payment standing", "Class", "Agreed fee", "Verified net", "Outstanding"],
    ...registrations.map((item) => {
      const net = netCents(decimalToCents(item.agreedFee), decimalToCents(item.approvedDiscount) || 0);
      const summary = summarizeLedger(item.payments.map((payment) => ({ amountCents: decimalToCents(payment.amount) || 0, type: payment.ledgerType, status: payment.verificationStatus })), net);
      return [
        item.registrationNumber,
        item.student.fullName,
        item.student.phone,
        item.course.name,
        item.intakeName || "",
        appDate(item.registeredAt),
        item.registrationStatus,
        item.paymentStanding,
        item.classProgress,
        item.agreedFee?.toString() || "",
        centsToDecimalString(summary.verifiedNetCents),
        summary.outstandingCents == null ? "" : centsToDecimalString(summary.outstandingCents),
      ];
    }),
  ]);
}
