import Link from "next/link";
import { BarChart3, Banknote, CalendarCheck, CircleDollarSign, UserRoundCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { appDate, appDateRange } from "@/lib/timezone";
import { formatStatus, money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission("VIEW_REPORTS");
  const params = await searchParams;
  const today = appDate(new Date());
  const defaultFrom = `${today.slice(0, 8)}01`;
  const dateFrom = typeof params.dateFrom === "string" && params.dateFrom ? params.dateFrom : defaultFrom;
  const dateTo = typeof params.dateTo === "string" && params.dateTo ? params.dateTo : today;
  const range = {
    gte: appDateRange(dateFrom).start,
    lt: appDateRange(dateTo).end,
  };

  const bookings = await prisma.booking.findMany({
    where: { startDateTime: range },
    select: {
      bookingCode: true,
      startDateTime: true,
      status: true,
      source: true,
      service: { select: { id: true, name: true, price: true } },
      bookedBy: { select: { id: true, name: true } },
      payment: {
        select: {
          paidAmount: true,
          requiredAdvanceAmount: true,
          paymentStatus: true,
          advanceForfeitedAmount: true,
        },
      },
    },
    orderBy: { startDateTime: "asc" },
  });

  let collected = 0;
  let outstanding = 0;
  let forfeited = 0;
  const statusCounts = new Map<string, number>();
  const daily = new Map<string, { total: number; confirmed: number; completed: number; cancelled: number; noShow: number; collected: number }>();
  const services = new Map<string, { name: string; bookings: number; completed: number; noShow: number; collected: number }>();
  const staff = new Map<string, { name: string; bookings: number; confirmed: number; completed: number; collected: number }>();

  for (const booking of bookings) {
    statusCounts.set(booking.status, (statusCounts.get(booking.status) || 0) + 1);
    const paidAmount = paymentAmount(booking.payment);
    const isAcceptedPayment = booking.payment && ["ADVANCE_CONFIRMED", "FULLY_PAID"].includes(booking.payment.paymentStatus);
    if (isAcceptedPayment) collected += paidAmount;
    if (isAcceptedPayment && !["COMPLETED", "CANCELLED", "REJECTED", "EXPIRED", "NO_SHOW"].includes(booking.status)) {
      outstanding += Math.max(0, Number(booking.service.price) - paidAmount);
    }
    forfeited += Number(booking.payment?.advanceForfeitedAmount || 0);

    const dayKey = appDate(booking.startDateTime);
    const day = daily.get(dayKey) || { total: 0, confirmed: 0, completed: 0, cancelled: 0, noShow: 0, collected: 0 };
    day.total += 1;
    if (booking.status === "CONFIRMED") day.confirmed += 1;
    if (booking.status === "COMPLETED") day.completed += 1;
    if (booking.status === "CANCELLED" || booking.status === "REJECTED") day.cancelled += 1;
    if (booking.status === "NO_SHOW" || (booking.status === "EXPIRED" && Number(booking.payment?.advanceForfeitedAmount || 0) > 0)) day.noShow += 1;
    if (isAcceptedPayment) day.collected += paidAmount;
    daily.set(dayKey, day);

    const service = services.get(booking.service.id) || { name: booking.service.name, bookings: 0, completed: 0, noShow: 0, collected: 0 };
    service.bookings += 1;
    if (booking.status === "COMPLETED") service.completed += 1;
    if (booking.status === "NO_SHOW" || (booking.status === "EXPIRED" && Number(booking.payment?.advanceForfeitedAmount || 0) > 0)) service.noShow += 1;
    if (isAcceptedPayment) service.collected += paidAmount;
    services.set(booking.service.id, service);

    const staffKey = booking.bookedBy?.id || "online";
    const staffRow = staff.get(staffKey) || { name: booking.bookedBy?.name || "Online clients", bookings: 0, confirmed: 0, completed: 0, collected: 0 };
    staffRow.bookings += 1;
    if (booking.status === "CONFIRMED") staffRow.confirmed += 1;
    if (booking.status === "COMPLETED") staffRow.completed += 1;
    if (isAcceptedPayment) staffRow.collected += paidAmount;
    staff.set(staffKey, staffRow);
  }

  const noShows = (statusCounts.get("NO_SHOW") || 0)
    + bookings.filter((booking) => booking.status === "EXPIRED" && Number(booking.payment?.advanceForfeitedAmount || 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Business reports</p>
          <h1 className="font-display text-3xl font-bold">Performance and payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Appointment dates and totals use East Africa Time.</p>
        </div>
        <Button asChild variant="outline"><Link href="/admin/payments">Open payment records</Link></Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <form className="flex flex-wrap items-end gap-3">
            <div><label className="mb-2 block text-sm font-semibold" htmlFor="reportFrom">From</label><Input id="reportFrom" name="dateFrom" type="date" defaultValue={dateFrom} required /></div>
            <div><label className="mb-2 block text-sm font-semibold" htmlFor="reportTo">To</label><Input id="reportTo" name="dateTo" type="date" defaultValue={dateTo} required /></div>
            <Button type="submit">Apply report dates</Button>
            <Button asChild variant="outline"><Link href="/admin/reports">Current month</Link></Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={CalendarCheck} label="Appointments" value={String(bookings.length)} />
        <Metric icon={BarChart3} label="Completed" value={String(statusCounts.get("COMPLETED") || 0)} />
        <Metric icon={UserRoundCheck} label="No-shows" value={String(noShows)} />
        <Metric icon={Banknote} label="Collected" value={money(collected)} />
        <Metric icon={CircleDollarSign} label="Outstanding" value={money(outstanding)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportTable title="Daily appointments" headers={["Date", "Total", "Confirmed", "Completed", "Cancelled", "No-show", "Collected"]}>
          {[...daily.entries()].map(([date, row]) => <tr key={date}><Td>{friendlyDate(date)}</Td><Td>{row.total}</Td><Td>{row.confirmed}</Td><Td>{row.completed}</Td><Td>{row.cancelled}</Td><Td>{row.noShow}</Td><Td>{money(row.collected)}</Td></tr>)}
          {daily.size === 0 ? <EmptyRow colSpan={7} /> : null}
        </ReportTable>

        <ReportTable title="Service performance" headers={["Service", "Bookings", "Completed", "No-show", "Collected"]}>
          {[...services.values()].sort((a, b) => b.bookings - a.bookings).map((row) => <tr key={row.name}><Td className="font-semibold">{row.name}</Td><Td>{row.bookings}</Td><Td>{row.completed}</Td><Td>{row.noShow}</Td><Td>{money(row.collected)}</Td></tr>)}
          {services.size === 0 ? <EmptyRow colSpan={5} /> : null}
        </ReportTable>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ReportTable title="Booking source and staff" headers={["Booked by", "Bookings", "Currently confirmed", "Completed", "Collected"]}>
          {[...staff.values()].sort((a, b) => b.bookings - a.bookings).map((row) => <tr key={row.name}><Td className="font-semibold">{row.name}</Td><Td>{row.bookings}</Td><Td>{row.confirmed}</Td><Td>{row.completed}</Td><Td>{money(row.collected)}</Td></tr>)}
          {staff.size === 0 ? <EmptyRow colSpan={5} /> : null}
        </ReportTable>

        <Card>
          <CardHeader><CardTitle>Financial summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label="Accepted payments" value={money(collected)} />
            <SummaryRow label="Outstanding balances" value={money(outstanding)} />
            <SummaryRow label="Forfeited no-show advances" value={money(forfeited)} />
            <SummaryRow label="Payment proofs waiting" value={String(statusCounts.get("PAYMENT_UPLOADED") || 0)} />
            <p className="pt-2 text-xs leading-5 text-muted-foreground">Collected totals use confirmed payment amounts. Outstanding balances include active accepted bookings only.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Status totals</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {[...statusCounts.entries()].map(([status, count]) => <div key={status} className="rounded-xl border bg-background px-4 py-3"><p className="text-xs font-semibold uppercase text-muted-foreground">{formatStatus(status)}</p><p className="mt-1 text-2xl font-bold">{count}</p></div>)}
          {statusCounts.size === 0 ? <p className="text-sm text-muted-foreground">No bookings in this date range.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function paymentAmount(payment: {
  paidAmount: { toString(): string } | null;
  requiredAdvanceAmount: { toString(): string };
  paymentStatus: string;
} | null) {
  if (!payment || !["ADVANCE_CONFIRMED", "FULLY_PAID"].includes(payment.paymentStatus)) return 0;
  return Number(payment.paidAmount ?? payment.requiredAdvanceAmount);
}

function friendlyDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <Card><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></CardContent></Card>;
}

function ReportTable({ title, headers, children }: { title: string; headers: string[]; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><thead><tr>{headers.map((header) => <Th key={header}>{header}</Th>)}</tr></thead><tbody>{children}</tbody></Table></CardContent></Card>;
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return <tr><Td colSpan={colSpan} className="text-center text-muted-foreground">No data in this date range.</Td></tr>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3"><span className="text-sm text-muted-foreground">{label}</span><strong>{value}</strong></div>;
}
