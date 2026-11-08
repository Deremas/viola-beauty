import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { companyName } from "@/lib/brand";
import { getSiteContent } from "@/lib/courses/site";
import { appDate } from "@/lib/timezone";
import { formatStatus } from "@/lib/format";
import { PrintButton } from "@/components/admin/print-button";

export const dynamic = "force-dynamic";

export default async function CourseReceiptPage({ params }: { params: Promise<{ id: string; paymentId: string }> }) {
  await requirePermission("VIEW_REGISTRATIONS");
  const { id, paymentId } = await params;
  const payment = await prisma.coursePayment.findFirst({
    where: { id: paymentId, registrationId: id, verificationStatus: "VERIFIED" },
    include: { registration: { include: { student: true, course: true } }, verifiedBy: { select: { name: true } } },
  });
  if (!payment) notFound();
  const site = await getSiteContent();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <style>{`@media print { aside, header, .print\\:hidden { display: none !important; } main { padding: 0 !important; } }`}</style>
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/admin/registrations/${id}?tab=payments`} className="text-sm font-semibold text-brand">Back to payments</Link>
        <PrintButton />
      </div>
      <article className="rounded-lg border bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">{companyName}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Payment receipt</h1>
        <p className="mt-2 text-sm text-muted-foreground">{site.addressLine}, {site.city}</p>
        <p className="text-sm text-muted-foreground">{site.phonePrimaryDisplay} · {site.phoneSecondaryDisplay}</p>
        <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Receipt</dt><dd className="font-semibold">{payment.id.slice(0, 8).toUpperCase()}</dd></div>
          <div><dt className="text-muted-foreground">Registration</dt><dd className="font-semibold">{payment.registration.registrationNumber}</dd></div>
          <div><dt className="text-muted-foreground">Student</dt><dd className="font-semibold">{payment.registration.student.fullName}</dd></div>
          <div><dt className="text-muted-foreground">Phone</dt><dd className="font-semibold">{payment.registration.student.phone}</dd></div>
          <div><dt className="text-muted-foreground">Course</dt><dd className="font-semibold">{payment.registration.course.name}</dd></div>
          <div><dt className="text-muted-foreground">Date</dt><dd className="font-semibold">{appDate(payment.paidAt)}</dd></div>
          <div><dt className="text-muted-foreground">Type</dt><dd className="font-semibold">{formatStatus(payment.ledgerType)} · {formatStatus(payment.method)}</dd></div>
          <div><dt className="text-muted-foreground">Reference</dt><dd className="font-semibold">{payment.transactionReference || "—"}</dd></div>
        </dl>
        <p className="mt-8 font-display text-4xl font-semibold">{payment.amount.toString()} ETB</p>
        <p className="mt-2 text-sm text-muted-foreground">Verified{payment.verifiedBy?.name ? ` by ${payment.verifiedBy.name}` : ""}{payment.verifiedAt ? ` on ${appDate(payment.verifiedAt)}` : ""}.</p>
        {payment.remarks ? <p className="mt-4 text-sm">{payment.remarks}</p> : null}
      </article>
    </div>
  );
}
