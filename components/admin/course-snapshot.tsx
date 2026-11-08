import Link from "next/link";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { hasPermission, type SessionUser } from "@/lib/permissions";
import { centsToDecimalString, decimalToCents } from "@/lib/courses/money";
import { buildCourseReport } from "@/lib/courses/report";
import { readIfReady } from "@/lib/courses/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export async function CourseSnapshot({ user }: { user: SessionUser }) {
  if (!hasPermission(user, "VIEW_REGISTRATIONS") && !hasPermission(user, "VIEW_COURSES")) return null;
  const stats = await readIfReady(async () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const [pending, approved, confirmed, courses, students, scheduled, started, rows] = await Promise.all([
      prisma.courseRegistration.count({ where: { registrationStatus: "PENDING" } }),
      prisma.courseRegistration.count({ where: { registrationStatus: "APPROVED" } }),
      prisma.courseRegistration.count({ where: { registrationStatus: "CONFIRMED" } }),
      prisma.course.count({ where: { publicationStatus: "PUBLISHED", registrationOpen: true } }),
      prisma.student.count(),
      prisma.courseRegistration.count({ where: { classProgress: "SCHEDULED", expectedStartDate: { gte: todayStart } } }),
      prisma.courseRegistration.count({ where: { classProgress: "STARTED" } }),
      prisma.courseRegistration.findMany({
        include: { course: { select: { id: true, name: true } }, payments: { select: { amount: true, ledgerType: true, verificationStatus: true } } },
      }),
    ]);
    const report = buildCourseReport(rows.map((row) => ({
      courseId: row.course.id,
      courseName: row.course.name,
      registrationStatus: row.registrationStatus,
      classProgress: row.classProgress,
      expectedStartDate: row.expectedStartDate,
      agreedFee: row.agreedFee,
      approvedDiscount: row.approvedDiscount,
      payments: row.payments.map((payment) => ({ amountCents: decimalToCents(payment.amount) || 0, type: payment.ledgerType, status: payment.verificationStatus })),
    })));
    const awaiting = rows.filter((row) => ["UNPAID", "PARTIALLY_PAID", "OVERDUE"].includes(row.paymentStanding) && !["REJECTED", "CANCELLED", "WITHDRAWN"].includes(row.registrationStatus)).length;
    return { pending, approved, confirmed, awaiting, courses, students, scheduled, started, revenue: report.verifiedRevenueCents, outstanding: report.outstandingCents };
  }, null);
  if (!stats) return null;
  const cards = [
    ["Pending course registrations", stats.pending],
    ["Approved registrations", stats.approved],
    ["Confirmed registrations", stats.confirmed],
    ["Awaiting payment", stats.awaiting],
    ["Courses available", stats.courses],
    ["Students registered", stats.students],
    ["Classes scheduled to start", stats.scheduled],
    ["Classes started", stats.started],
    ["Verified course revenue", `${centsToDecimalString(stats.revenue)} ETB`],
    ["Outstanding course balances", `${centsToDecimalString(stats.outstanding)} ETB`],
  ];
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Courses</h2>
        <Button asChild variant="outline" size="sm"><Link href="/admin/courses/reports">Course reports</Link></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{value}</CardContent></Card>
        ))}
      </div>
    </section>
  );
}
