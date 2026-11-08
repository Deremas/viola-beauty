import { applyOverdue, decimalToCents, isCourseOverdue, netCents, summarizeLedger, type LedgerRow, type PaymentStanding } from "@/lib/courses/money";

export type ReportRegistration = {
  courseId: string;
  courseName: string;
  registrationStatus: string;
  classProgress: string;
  expectedStartDate: Date | null;
  agreedFee: { toString(): string } | null;
  approvedDiscount: { toString(): string } | null;
  payments: LedgerRow[];
};

export function buildCourseReport(rows: ReportRegistration[], now = new Date()) {
  const byCourse = new Map<string, { name: string; registrations: number; verifiedCents: number; outstandingCents: number }>();
  const byStatus = new Map<string, number>();
  const byClass = new Map<string, number>();
  const byPayment = new Map<PaymentStanding, number>();
  let verifiedRevenueCents = 0;
  let outstandingCents = 0;
  let refundCents = 0;

  for (const row of rows) {
    const net = netCents(decimalToCents(row.agreedFee), decimalToCents(row.approvedDiscount) || 0);
    const summary = summarizeLedger(row.payments, net);
    const standing = applyOverdue(summary.standing, isCourseOverdue({
      expectedStartDate: row.expectedStartDate,
      registrationStatus: row.registrationStatus,
      outstandingCents: summary.outstandingCents,
      now,
    }));
    verifiedRevenueCents += Math.max(0, summary.verifiedNetCents);
    refundCents += summary.returnedCents;
    outstandingCents += summary.outstandingCents || 0;
    byStatus.set(row.registrationStatus, (byStatus.get(row.registrationStatus) || 0) + 1);
    byClass.set(row.classProgress, (byClass.get(row.classProgress) || 0) + 1);
    byPayment.set(standing, (byPayment.get(standing) || 0) + 1);
    const course = byCourse.get(row.courseId) || { name: row.courseName, registrations: 0, verifiedCents: 0, outstandingCents: 0 };
    course.registrations += 1;
    course.verifiedCents += Math.max(0, summary.verifiedNetCents);
    course.outstandingCents += summary.outstandingCents || 0;
    byCourse.set(row.courseId, course);
  }

  return {
    byCourse: [...byCourse.values()].sort((left, right) => right.registrations - left.registrations),
    byStatus: [...byStatus.entries()],
    byClass: [...byClass.entries()],
    byPayment: [...byPayment.entries()],
    verifiedRevenueCents,
    outstandingCents,
    refundCents,
    registrations: rows.length,
  };
}
