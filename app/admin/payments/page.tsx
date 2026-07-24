import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { formatStatus, money, shortDateTime } from "@/lib/format";
import { buildPaymentWhere, paymentFiltersFromRecord } from "@/lib/payment-query";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("VIEW_PAYMENTS");
  const params = await searchParams;
  const filters = paymentFiltersFromRecord(params);
  const where = buildPaymentWhere(filters);
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const pageSize = 20;

  const [payments, totalPayments, summaryPayments, bankAccounts, services] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: {
        id: true,
        bookingId: true,
        requiredAdvanceAmount: true,
        paidAmount: true,
        paymentStatus: true,
        paymentMethod: true,
        advanceForfeitedAmount: true,
        createdAt: true,
        booking: { select: { bookingCode: true, startDateTime: true, status: true, client: true, service: true } },
        bankAccount: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      select: {
        paidAmount: true,
        requiredAdvanceAmount: true,
        advanceForfeitedAmount: true,
        paymentStatus: true,
        booking: { select: { status: true, service: { select: { price: true } } } },
      },
    }),
    prisma.bankAccount.findMany({ where: { deletedAt: null }, orderBy: { bankName: "asc" } }),
    prisma.service.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalPayments / pageSize));
  const paidTotal = summaryPayments.reduce((sum, payment) => sum + acceptedPaidAmount(payment), 0);
  const outstandingTotal = summaryPayments.reduce((sum, payment) => {
    if (!["ADVANCE_CONFIRMED", "FULLY_PAID"].includes(payment.paymentStatus)) return sum;
    if (["COMPLETED", "CANCELLED", "REJECTED", "EXPIRED", "NO_SHOW"].includes(payment.booking.status)) return sum;
    return sum + Math.max(0, Number(payment.booking.service.price) - acceptedPaidAmount(payment));
  }, 0);
  const forfeitedTotal = summaryPayments.reduce((sum, payment) => sum + Number(payment.advanceForfeitedAmount || 0), 0);
  const proofCount = summaryPayments.filter((payment) => payment.paymentStatus === "PROOF_UPLOADED").length;

  const filteredQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) filteredQuery.set(key, value);
  const exportHref = `/api/admin/payments/export${filteredQuery.size ? `?${filteredQuery}` : ""}`;

  function pageHref(nextPage: number) {
    const query = new URLSearchParams(filteredQuery);
    if (nextPage > 1) query.set("page", String(nextPage));
    return `/admin/payments${query.size ? `?${query}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Payments</h1><p className="text-sm text-muted-foreground">Review advances, full payments, balances, and forfeited no-show amounts.</p></div>
        <Button asChild variant="outline"><a href={exportHref}><Download className="h-4 w-4" />Export filtered CSV</a></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Accepted payments" value={money(paidTotal)} />
        <Summary label="Outstanding balances" value={money(outstandingTotal)} />
        <Summary label="Forfeited advances" value={money(forfeitedTotal)} />
        <Summary label="Proofs waiting" value={String(proofCount)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Payment filters</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Input name="client" placeholder="Customer name" defaultValue={filters.client} />
            <Input name="phone" placeholder="Phone number" defaultValue={filters.phone} />
            <Input name="dateFrom" type="date" defaultValue={filters.dateFrom} aria-label="Appointment date from" />
            <Input name="dateTo" type="date" defaultValue={filters.dateTo} aria-label="Appointment date to" />
            <Select name="status" defaultValue={filters.status}><option value="">Any payment status</option>{Object.values(PaymentStatus).map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</Select>
            <Select name="bankAccountId" defaultValue={filters.bankAccountId}><option value="">Any bank account</option>{bankAccounts.map((bank) => <option key={bank.id} value={bank.id}>{bank.bankName} - {bank.accountNumber}</option>)}</Select>
            <Select name="serviceId" defaultValue={filters.serviceId}><option value="">Any service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</Select>
            <Button type="submit">Apply payment filters</Button>
            <Button asChild variant="outline"><Link href="/admin/payments">Clear payment filters</Link></Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Payment records</CardTitle><p className="text-sm text-muted-foreground">{totalPayments} matching record{totalPayments === 1 ? "" : "s"}</p></div></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Booking</Th><Th>Customer</Th><Th>Service</Th><Th>Appointment</Th><Th>Required advance</Th><Th>Paid</Th><Th>Balance</Th><Th>Status</Th><Th>Bank</Th><Th>Action</Th></tr></thead>
            <tbody>
              {payments.map((payment) => {
                const paid = acceptedPaidAmount(payment);
                const balance = Math.max(0, Number(payment.booking.service.price) - paid);
                return <tr key={payment.id}>
                  <Td className="font-semibold">{payment.booking.bookingCode}</Td>
                  <Td><p className="font-semibold">{payment.booking.client.fullName}</p><p className="text-xs text-muted-foreground">{payment.booking.client.phone}</p></Td>
                  <Td>{payment.booking.service.name}</Td>
                  <Td>{shortDateTime(payment.booking.startDateTime)}</Td>
                  <Td>{money(payment.requiredAdvanceAmount)}</Td>
                  <Td>{paid > 0 ? money(paid) : "Not confirmed"}</Td>
                  <Td>{money(balance)}</Td>
                  <Td><StatusBadge status={payment.paymentStatus} /></Td>
                  <Td>{payment.bankAccount?.bankName || "Not selected"}</Td>
                  <Td><Button asChild variant="outline" size="icon" title="View booking payment"><Link href={`/admin/bookings/${payment.bookingId}`}><Eye className="h-4 w-4" /><span className="sr-only">View booking payment</span></Link></Button></Td>
                </tr>;
              })}
              {payments.length === 0 ? <tr><Td colSpan={10} className="text-center text-muted-foreground">No payments match these filters.</Td></tr> : null}
            </tbody>
          </Table>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 ? <Button asChild variant="outline" size="sm"><Link href={pageHref(page - 1)}>Previous</Link></Button> : <Button variant="outline" size="sm" disabled>Previous</Button>}
              {page < totalPages ? <Button asChild variant="outline" size="sm"><Link href={pageHref(page + 1)}>Next</Link></Button> : <Button variant="outline" size="sm" disabled>Next</Button>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function acceptedPaidAmount(payment: {
  paidAmount: { toString(): string } | null;
  requiredAdvanceAmount: { toString(): string };
  paymentStatus: string;
}) {
  if (!["ADVANCE_CONFIRMED", "FULLY_PAID"].includes(payment.paymentStatus)) return 0;
  return Number(payment.paidAmount ?? payment.requiredAdvanceAmount);
}

function Summary({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>;
}
