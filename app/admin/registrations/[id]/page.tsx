import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasPermission, requirePermission } from "@/lib/permissions";
import { formatStatus } from "@/lib/format";
import { appDate } from "@/lib/timezone";
import { StatusBadge } from "@/lib/status";
import { applyOverdue, centsToDecimalString, decimalToCents, isCourseOverdue, netCents, summarizeLedger } from "@/lib/courses/money";
import { markClass, recordCoursePayment, reviewCoursePayment, updateIntake, updateRegistrationFee, updateRegistrationStatus, updateStartDate } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function RegistrationDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; error?: string }> }) {
  const user = await requirePermission("VIEW_REGISTRATIONS");
  const { id } = await params;
  const query = await searchParams;
  const registration = await prisma.courseRegistration.findUnique({
    where: { id },
    include: { student: true, course: true, payments: { orderBy: { paidAt: "desc" }, include: { recordedBy: true, verifiedBy: true } }, events: { orderBy: { createdAt: "desc" }, include: { actor: true } } },
  });
  if (!registration) notFound();
  const tab = query.tab === "payments" || query.tab === "history" ? query.tab : "overview";
  const sensitive = hasPermission(user, "VIEW_STUDENT_SENSITIVE");
  const net = netCents(decimalToCents(registration.agreedFee), decimalToCents(registration.approvedDiscount) || 0);
  const summary = summarizeLedger(registration.payments.map((payment) => ({ amountCents: decimalToCents(payment.amount) || 0, type: payment.ledgerType, status: payment.verificationStatus })), net);
  const standing = applyOverdue(summary.standing, isCourseOverdue({ expectedStartDate: registration.expectedStartDate, registrationStatus: registration.registrationStatus, outstandingCents: summary.outstandingCents }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground"><Link href="/admin/registrations" className="font-semibold text-brand">Registrations</Link></p>
        <h1 className="font-display text-3xl font-bold">{registration.registrationNumber}</h1>
        <p className="text-sm text-muted-foreground">{registration.student.fullName} · {registration.course.name}</p>
      </div>
      {query.error ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{query.error}</p> : null}
      <div className="flex gap-2">
        {["overview", "payments", "history"].map((item) => <Button key={item} asChild variant={tab === item ? "default" : "outline"} size="sm"><Link href={`/admin/registrations/${id}?tab=${item}`}>{item[0].toUpperCase() + item.slice(1)}</Link></Button>)}
      </div>
      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-3 rounded-lg border bg-white p-5 text-sm">
            <p><strong>Phone:</strong> {registration.student.phone}</p>
            <p><strong>Email:</strong> {registration.student.email || "—"}</p>
            {sensitive ? <p><strong>Address:</strong> {registration.addressSnapshot || "—"}</p> : null}
            {sensitive ? <p><strong>Experience:</strong> {registration.experienceSnapshot || "—"}</p> : null}
            <p><strong>Intake:</strong> {registration.intakeName || "—"}</p>
            <p><strong>Registered:</strong> {appDate(registration.registeredAt)} · {formatStatus(registration.source)}</p>
            <p><strong>Expected start:</strong> {registration.expectedStartDate ? appDate(registration.expectedStartDate) : "—"}</p>
            <p><strong>Started:</strong> {registration.actualStartedAt ? appDate(registration.actualStartedAt) : "—"}</p>
            <p><strong>Finished:</strong> {registration.actualFinishedAt ? appDate(registration.actualFinishedAt) : "—"}</p>
            <p className="flex flex-wrap gap-2"><StatusBadge status={registration.registrationStatus} /><StatusBadge status={standing} /><StatusBadge status={registration.classProgress} /></p>
            {registration.notes ? <p><strong>Notes:</strong> {registration.notes}</p> : null}
          </section>
          <div className="space-y-4">
            {hasPermission(user, "APPROVE_REGISTRATIONS") || hasPermission(user, "CONFIRM_REGISTRATIONS") ? (
              <form action={updateRegistrationStatus} className="space-y-3 rounded-lg border bg-white p-4">
                <input type="hidden" name="id" value={id} />
                <Select name="status" aria-label="Next registration status"><option value="APPROVED">Approve</option><option value="CONFIRMED">Confirm</option><option value="REJECTED">Reject</option><option value="CANCELLED">Cancel</option><option value="WITHDRAWN">Withdraw</option></Select>
                <Textarea name="reason" placeholder="Reason, required for reject, cancel, or withdraw" />
                <Button type="submit">Update registration</Button>
              </form>
            ) : null}
            {hasPermission(user, "ASSIGN_INTAKE") ? <form action={updateIntake} className="space-y-3 rounded-lg border bg-white p-4"><input type="hidden" name="id" value={id} /><Input name="intakeName" defaultValue={registration.intakeName || ""} placeholder="Oct 23 Batch" aria-label="Intake name" /><Button type="submit">Save intake</Button></form> : null}
            {hasPermission(user, "CHANGE_START_DATE") ? <form action={updateStartDate} className="space-y-3 rounded-lg border bg-white p-4"><input type="hidden" name="id" value={id} /><Input type="date" name="expectedStartDate" defaultValue={registration.expectedStartDate ? appDate(registration.expectedStartDate) : ""} aria-label="Expected start date" /><Button type="submit">Save start date</Button></form> : null}
            {hasPermission(user, "MARK_CLASS_STARTED") ? <form action={markClass} className="space-y-3 rounded-lg border bg-white p-4"><input type="hidden" name="id" value={id} /><input type="hidden" name="progress" value="STARTED" /><Input type="date" name="date" required aria-label="Actual start date" /><Textarea name="reason" placeholder="Remarks" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" value="yes" /> Confirm this student only</label><Button type="submit">Mark class started</Button></form> : null}
            {hasPermission(user, "MARK_CLASS_FINISHED") ? <form action={markClass} className="space-y-3 rounded-lg border bg-white p-4"><input type="hidden" name="id" value={id} /><input type="hidden" name="progress" value="FINISHED" /><Input type="date" name="date" required aria-label="Actual finish date" /><Textarea name="reason" placeholder="Remarks" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" value="yes" /> Confirm this student only</label><Button type="submit">Mark class finished</Button></form> : null}
          </div>
        </div>
      ) : null}
      {tab === "payments" ? (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-lg border bg-white p-5 sm:grid-cols-4">
            <p className="text-sm">Agreed fee<br /><strong>{registration.agreedFee ? `${registration.agreedFee.toString()} ETB` : "Not set"}</strong></p>
            <p className="text-sm">Discount<br /><strong>{registration.approvedDiscount.toString()} ETB</strong></p>
            <p className="text-sm">Net<br /><strong>{net == null ? "—" : `${centsToDecimalString(net)} ETB`}</strong></p>
            <p className="text-sm">Outstanding<br /><strong>{summary.outstandingCents == null ? "—" : `${centsToDecimalString(summary.outstandingCents)} ETB`}</strong></p>
          </div>
          {hasPermission(user, "UPDATE_REGISTRATIONS") ? <form action={updateRegistrationFee} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4"><input type="hidden" name="id" value={id} /><Input name="agreedFee" defaultValue={registration.agreedFee?.toString() || ""} aria-label="Agreed fee" placeholder="Agreed fee" /><Input name="approvedDiscount" defaultValue={registration.approvedDiscount.toString()} aria-label="Discount" /><Input name="requiredDeposit" defaultValue={registration.requiredDeposit?.toString() || ""} aria-label="Deposit" placeholder="Deposit" /><Button type="submit">Save fee</Button></form> : null}
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead><tr className="text-left"><th className="p-3">Date</th><th>Type</th><th className="text-right">Amount</th><th>Status</th><th>Reference</th><th></th></tr></thead>
              <tbody>
                {registration.payments.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="p-3">{appDate(payment.paidAt)}</td>
                    <td>{formatStatus(payment.ledgerType)} · {formatStatus(payment.method)}</td>
                    <td className="text-right">{payment.amount.toString()} ETB</td>
                    <td><StatusBadge status={payment.verificationStatus} /></td>
                    <td>{payment.transactionReference || "—"}</td>
                    <td className="p-3 text-right">
                      {payment.proofPath ? <a className="mr-3 font-semibold text-brand" href={`/api/admin/course-payments/${payment.id}/proof`}>Proof</a> : null}
                      {payment.verificationStatus === "PENDING" && hasPermission(user, "VERIFY_COURSE_PAYMENTS") ? <form action={reviewCoursePayment} className="inline"><input type="hidden" name="id" value={id} /><input type="hidden" name="paymentId" value={payment.id} /><input type="hidden" name="decision" value="VERIFIED" /><Button size="sm" type="submit">Verify</Button></form> : null}
                      {payment.verificationStatus === "PENDING" && hasPermission(user, "REJECT_COURSE_PAYMENTS") ? <form action={reviewCoursePayment} className="ml-2 inline"><input type="hidden" name="id" value={id} /><input type="hidden" name="paymentId" value={payment.id} /><input type="hidden" name="decision" value="REJECTED" /><Button size="sm" type="submit" variant="outline">Reject</Button></form> : null}
                      {payment.verificationStatus === "VERIFIED" ? <Link className="ml-3 font-semibold text-brand" href={`/admin/registrations/${id}/receipt/${payment.id}`}>Receipt</Link> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasPermission(user, "RECORD_COURSE_PAYMENTS") ? (
            <form action={recordCoursePayment} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2">
              <input type="hidden" name="id" value={id} />
              <Input name="amount" placeholder="Amount" aria-label="Amount" required />
              <Select name="method" aria-label="Method"><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank transfer</option></Select>
              <Select name="ledgerType" aria-label="Type"><option value="PAYMENT">Payment</option><option value="REFUND">Refund</option><option value="REVERSAL">Reversal</option></Select>
              <Input type="date" name="paidAt" aria-label="Payment date" required />
              <Input name="transactionReference" placeholder="Transaction reference" aria-label="Transaction reference" />
              <Input type="file" name="proof" accept="image/jpeg,image/png,image/webp,application/pdf" aria-label="Payment proof" />
              <Textarea name="remarks" placeholder="Remarks" className="md:col-span-2" />
              {hasPermission(user, "VERIFY_COURSE_PAYMENTS") ? <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="verifyNow" value="yes" /> Verify this payment now</label> : null}
              <Button type="submit">Record payment</Button>
            </form>
          ) : null}
        </div>
      ) : null}
      {tab === "history" ? (
        <ol className="space-y-3">
          {registration.events.map((event) => <li key={event.id} className="rounded-lg border bg-white p-4 text-sm"><p className="font-semibold">{event.action}</p><p className="text-muted-foreground">{event.previousValue || "—"} → {event.newValue || "—"} · {event.actor?.name || "System"} · {appDate(event.createdAt)}</p>{event.reason ? <p className="mt-1">{event.reason}</p> : null}</li>)}
        </ol>
      ) : null}
    </div>
  );
}
