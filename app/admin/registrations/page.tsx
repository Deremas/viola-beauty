import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hasPermission, requirePermission } from "@/lib/permissions";
import { formatStatus } from "@/lib/format";
import { appDate } from "@/lib/timezone";
import { decimalToCents, netCents, summarizeLedger, applyOverdue, isCourseOverdue, centsToDecimalString } from "@/lib/courses/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/lib/status";
import { Table, Td, Th } from "@/components/ui/table";
import { bulkMarkStarted } from "./actions";
import { canBulkStart } from "@/lib/courses/transitions";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("VIEW_REGISTRATIONS");
  const query = await searchParams;
  const courses = await prisma.course.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const registrations = await prisma.courseRegistration.findMany({
    where: {
      ...(query.course ? { courseId: query.course } : {}),
      ...(query.registration ? { registrationStatus: query.registration as never } : {}),
      ...(query.payment ? { paymentStanding: query.payment as never } : {}),
      ...(query.progress ? { classProgress: query.progress as never } : {}),
      ...(query.source ? { source: query.source as never } : {}),
      ...(query.q ? {
        OR: [
          { registrationNumber: { contains: query.q, mode: "insensitive" } },
          { student: { fullName: { contains: query.q, mode: "insensitive" } } },
          { student: { phone: { contains: query.q.replace(/\D/g, "") } } },
          { student: { id: query.q } },
        ],
      } : {}),
    },
    include: { student: true, course: true, payments: { select: { amount: true, ledgerType: true, verificationStatus: true } } },
    orderBy: { registeredAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Registrations</h1>
          <p className="text-sm text-muted-foreground">Review requests, then record payment and class progress separately.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission(user, "CREATE_REGISTRATIONS") ? <Button asChild><Link href="/admin/registrations/new">Add registration</Link></Button> : null}
          {hasPermission(user, "EXPORT_REGISTRATIONS") ? <Button asChild variant="outline"><Link href={`/api/admin/registrations/export?${new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString()}`}>Export CSV</Link></Button> : null}
        </div>
      </div>
      <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
        <Input name="q" defaultValue={query.q} placeholder="Name, phone, or reference" aria-label="Search registrations" />
        <Select name="course" defaultValue={query.course || ""} aria-label="Course"><option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</Select>
        <Select name="registration" defaultValue={query.registration || ""} aria-label="Registration status"><option value="">Any registration status</option>{["PENDING", "APPROVED", "CONFIRMED", "REJECTED", "CANCELLED", "WITHDRAWN"].map((status) => <option key={status}>{status}</option>)}</Select>
        <Select name="payment" defaultValue={query.payment || ""} aria-label="Payment status"><option value="">Any payment status</option>{["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED", "OVERDUE"].map((status) => <option key={status}>{status}</option>)}</Select>
        <Select name="progress" defaultValue={query.progress || ""} aria-label="Class progress"><option value="">Any class progress</option>{["NOT_SCHEDULED", "SCHEDULED", "STARTED", "FINISHED", "POSTPONED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}</Select>
        <Select name="source" defaultValue={query.source || ""} aria-label="Source"><option value="">Any source</option><option>WEBSITE</option><option>ADMIN</option><option>RECEPTION</option></Select>
        <Button type="submit">Filter</Button>
        <Button asChild variant="outline"><Link href="/admin/registrations">Clear Filters</Link></Button>
      </form>
      {query.error ? <p className="rounded-lg border border-destructive/30 bg-white p-3 text-sm text-destructive" role="alert">{query.error}</p> : null}
      <form action={bulkMarkStarted} className="space-y-3">
        {hasPermission(user, "BULK_UPDATE_REGISTRATIONS") ? (
          <div className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
            <Input type="date" name="date" aria-label="Actual start date" required />
            <Input name="reason" placeholder="Remarks for the selected students" aria-label="Bulk remarks" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" value="yes" /> Confirm selected students only</label>
            <Button type="submit">Mark selected as started</Button>
          </div>
        ) : null}
        <div className="overflow-x-auto rounded-lg border bg-white">
          <Table>
            <thead><tr>{hasPermission(user, "BULK_UPDATE_REGISTRATIONS") ? <Th>Select</Th> : null}<Th>Reference</Th><Th>Student</Th><Th>Phone</Th><Th>Course</Th><Th>Intake</Th><Th>Date</Th><Th>Registration</Th><Th>Payment</Th><Th className="text-right">Balance</Th><Th>Class</Th><Th></Th></tr></thead>
            <tbody>
              {registrations.map((registration) => {
                const net = netCents(decimalToCents(registration.agreedFee), decimalToCents(registration.approvedDiscount) || 0);
                const summary = summarizeLedger(registration.payments.map((payment) => ({ amountCents: decimalToCents(payment.amount) || 0, type: payment.ledgerType, status: payment.verificationStatus })), net);
                const standing = applyOverdue(summary.standing, isCourseOverdue({ expectedStartDate: registration.expectedStartDate, registrationStatus: registration.registrationStatus, outstandingCents: summary.outstandingCents }));
                const eligible = canBulkStart(registration);
                return (
                  <tr key={registration.id} className="hover:bg-muted/60">
                    {hasPermission(user, "BULK_UPDATE_REGISTRATIONS") ? <Td>{eligible ? <input type="checkbox" name="ids" value={registration.id} aria-label={`Select ${registration.registrationNumber}`} /> : null}</Td> : null}
                    <Td>{registration.registrationNumber}</Td>
                    <Td>{registration.student.fullName}</Td>
                    <Td>{registration.student.phone}</Td>
                    <Td>{registration.course.name}</Td>
                    <Td>{registration.intakeName || "—"}</Td>
                    <Td>{appDate(registration.registeredAt)}</Td>
                    <Td><StatusBadge status={registration.registrationStatus} /></Td>
                    <Td><StatusBadge status={standing} /></Td>
                    <Td className="text-right">{summary.outstandingCents == null ? "—" : centsToDecimalString(summary.outstandingCents)}</Td>
                    <Td>{formatStatus(registration.classProgress)}</Td>
                    <Td className="text-right"><Button asChild size="sm" variant="outline"><Link href={`/admin/registrations/${registration.id}`}>View</Link></Button></Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {registrations.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No registrations match these filters.</p> : null}
        </div>
      </form>
    </div>
  );
}
