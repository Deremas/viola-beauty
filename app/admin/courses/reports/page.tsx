import Link from "next/link";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { hasPermission, requirePermission } from "@/lib/permissions";
import { formatStatus } from "@/lib/format";
import { localDateTimeToUtc } from "@/lib/timezone";
import { centsToDecimalString, decimalToCents } from "@/lib/courses/money";
import { buildCourseReport } from "@/lib/courses/report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return `${centsToDecimalString(cents)} ETB`;
}

export default async function CourseReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("VIEW_REGISTRATIONS");
  const query = await searchParams;
  const from = query.from && /^\d{4}-\d{2}-\d{2}$/.test(query.from) ? query.from : "";
  const to = query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to) ? query.to : "";
  const courses = await prisma.course.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const rows = await prisma.courseRegistration.findMany({
    where: {
      ...(query.course ? { courseId: query.course } : {}),
      ...(query.registration ? { registrationStatus: query.registration as never } : {}),
      ...(from || to
        ? {
            registeredAt: {
              ...(from ? { gte: localDateTimeToUtc(from, "00:00") } : {}),
              ...(to ? { lt: addDays(localDateTimeToUtc(to, "00:00"), 1) } : {}),
            },
          }
        : {}),
    },
    include: {
      course: { select: { id: true, name: true } },
      payments: { select: { amount: true, ledgerType: true, verificationStatus: true } },
    },
    orderBy: { registeredAt: "desc" },
    take: 5000,
  });
  const report = buildCourseReport(rows.map((row) => ({
    courseId: row.course.id,
    courseName: row.course.name,
    registrationStatus: row.registrationStatus,
    classProgress: row.classProgress,
    expectedStartDate: row.expectedStartDate,
    agreedFee: row.agreedFee,
    approvedDiscount: row.approvedDiscount,
    payments: row.payments.map((payment) => ({
      amountCents: decimalToCents(payment.amount) || 0,
      type: payment.ledgerType,
      status: payment.verificationStatus,
    })),
  })));
  const exportQuery = new URLSearchParams(Object.entries({ from, to, course: query.course, registration: query.registration }).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Course reports</h1>
          <p className="text-sm text-muted-foreground">Registration, class progress, and verified course payments. Pending proofs are not counted as revenue.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission(user, "EXPORT_REGISTRATIONS") ? <Button asChild variant="outline"><Link href={`/api/admin/courses/reports?${exportQuery}`}>Export registrations</Link></Button> : null}
          {hasPermission(user, "EXPORT_COURSE_PAYMENTS") ? <Button asChild variant="outline"><Link href={`/api/admin/courses/reports?kind=payments&${exportQuery}`}>Export payments</Link></Button> : null}
        </div>
      </div>
      <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-5">
        <Input type="date" name="from" defaultValue={from} aria-label="From date" />
        <Input type="date" name="to" defaultValue={to} aria-label="To date" />
        <Select name="course" defaultValue={query.course || ""} aria-label="Course"><option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</Select>
        <Select name="registration" defaultValue={query.registration || ""} aria-label="Registration status"><option value="">Any status</option>{["PENDING", "APPROVED", "CONFIRMED", "REJECTED", "CANCELLED", "WITHDRAWN"].map((status) => <option key={status}>{status}</option>)}</Select>
        <div className="flex gap-2"><Button type="submit">Filter</Button><Button asChild variant="outline"><Link href="/admin/courses/reports">Clear</Link></Button></div>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Registrations" value={String(report.registrations)} />
        <Card label="Verified revenue" value={money(report.verifiedRevenueCents)} />
        <Card label="Outstanding" value={money(report.outstandingCents)} />
        <Card label="Refunds and reversals" value={money(report.refundCents)} />
      </div>
      <section className="overflow-x-auto rounded-lg border bg-white">
        <h2 className="border-b px-4 py-3 font-semibold">Course popularity</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th className="p-3">Course</th><th className="text-right">Registrations</th><th className="text-right">Verified</th><th className="text-right">Outstanding</th></tr></thead>
          <tbody>
            {report.byCourse.map((course) => (
              <tr key={course.name} className="border-t"><td className="p-3">{course.name}</td><td className="text-right">{course.registrations}</td><td className="text-right">{money(course.verifiedCents)}</td><td className="text-right">{money(course.outstandingCents)}</td></tr>
            ))}
          </tbody>
        </table>
        {report.byCourse.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No registrations match these filters.</p> : null}
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <Breakdown title="Registration status" rows={report.byStatus} />
        <Breakdown title="Class progress" rows={report.byClass} />
        <Breakdown title="Payment standing" rows={report.byPayment} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-white p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}

function Breakdown({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {rows.map(([status, count]) => <li key={status} className="flex justify-between gap-3"><span>{formatStatus(status)}</span><span className="font-semibold">{count}</span></li>)}
        {rows.length === 0 ? <li className="text-muted-foreground">None</li> : null}
      </ul>
    </section>
  );
}
