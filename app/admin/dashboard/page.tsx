import Link from "next/link";
import { endOfDay, endOfMonth, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";
import { money, shortDateTime } from "@/lib/format";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    todayConfirmed,
    todayAppointments,
    pendingPayments,
    pendingPaymentBookings,
    weekBookings,
    monthBookings,
    completed,
    cancelled,
    noShows,
    advancePayments,
    monthAdvancePayments,
    upcoming,
    latestReceptionistBookings,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: "CONFIRMED", startDateTime: { gte: todayStart, lte: todayEnd } } }),
    prisma.booking.findMany({
      where: { startDateTime: { gte: todayStart, lte: todayEnd }, status: { in: ["PAYMENT_UPLOADED", "CONFIRMED"] } },
      include: { client: true, service: true, payment: { select: { paymentStatus: true } }, bookedBy: true },
      orderBy: { startDateTime: "asc" },
    }),
    prisma.booking.count({ where: { status: "PAYMENT_UPLOADED" } }),
    prisma.booking.findMany({
      where: { status: "PAYMENT_UPLOADED" },
      include: { client: true, service: true, payment: { select: { paymentStatus: true, bankAccount: true } }, bookedBy: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.booking.count({ where: { createdAt: { gte: startOfWeek(now) } } }),
    prisma.booking.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.booking.count({ where: { status: "NO_SHOW" } }),
    prisma.payment.aggregate({ where: { paymentStatus: { in: ["ADVANCE_CONFIRMED", "FULLY_PAID"] } }, _sum: { requiredAdvanceAmount: true } }),
    prisma.payment.aggregate({
      where: {
        paymentStatus: { in: ["ADVANCE_CONFIRMED", "FULLY_PAID"] },
        booking: { startDateTime: { gte: monthStart, lte: monthEnd } },
      },
      _sum: { requiredAdvanceAmount: true },
    }),
    prisma.booking.findMany({
      where: { startDateTime: { gte: now }, status: { in: ["PAYMENT_UPLOADED", "CONFIRMED"] } },
      include: { client: true, service: true, payment: { select: { paymentStatus: true } }, bookedBy: true },
      orderBy: { startDateTime: "asc" },
      take: 8,
    }),
    prisma.booking.findMany({
      where: { source: "RECEPTIONIST" },
      include: { client: true, service: true, payment: { select: { paymentStatus: true } }, bookedBy: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const cards = [
    ["Today's Confirmed", todayConfirmed],
    ["Pending Payments", pendingPayments],
    ["This Week's Bookings", weekBookings],
    ["This Month's Bookings", monthBookings],
    ["Completed Sessions", completed],
    ["Cancelled Bookings", cancelled],
    ["No-Shows", noShows],
    ["Advance Collected", money(advancePayments._sum.requiredAdvanceAmount || 0)],
    ["This Month Advance", money(monthAdvancePayments._sum.requiredAdvanceAmount || 0)],
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{value}</CardContent>
          </Card>
        ))}
      </section>
      <DashboardTable
        title="Today's appointments"
        emptyText="No appointments for today yet."
        bookings={todayAppointments}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Pending payment review</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/bookings?status=PAYMENT_UPLOADED">Review all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Code</Th><Th>Client</Th><Th>Service</Th><Th>Date</Th><Th>Bank</Th><Th>Booked By</Th><Th></Th></tr></thead>
            <tbody>
              {pendingPaymentBookings.map((booking) => (
                <tr key={booking.id}>
                  <Td>{booking.bookingCode}</Td>
                  <Td>{booking.client.fullName}</Td>
                  <Td>{booking.service.name}</Td>
                  <Td>{shortDateTime(booking.startDateTime)}</Td>
                  <Td>{booking.payment?.bankAccount ? `${booking.payment.bankAccount.bankName} · ${booking.payment.bankAccount.accountNumber}` : "Not selected"}</Td>
                  <Td>{booking.bookedBy?.name || "Online Client"}</Td>
                  <Td><Link className="font-semibold text-primary" href={`/admin/bookings/${booking.id}`}>Open</Link></Td>
                </tr>
              ))}
              {pendingPaymentBookings.length === 0 ? (
                <tr><Td colSpan={7} className="text-center text-muted-foreground">No pending payment proofs.</Td></tr>
              ) : null}
            </tbody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Upcoming appointments</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Code</Th><Th>Client</Th><Th>Service</Th><Th>Date</Th><Th>Status</Th><Th>Payment</Th></tr></thead>
            <tbody>
              {upcoming.map((booking) => (
                <tr key={booking.id}>
                  <Td>{booking.bookingCode}</Td>
                  <Td>{booking.client.fullName}</Td>
                  <Td>{booking.service.name}</Td>
                  <Td>{shortDateTime(booking.startDateTime)}</Td>
                  <Td><StatusBadge status={booking.status} /></Td>
                  <Td>{booking.payment ? <StatusBadge status={booking.payment.paymentStatus} /> : null}</Td>
                </tr>
              ))}
              {upcoming.length === 0 ? (
                <tr><Td colSpan={6} className="text-center text-muted-foreground">No upcoming appointments.</Td></tr>
              ) : null}
            </tbody>
          </Table>
        </CardContent>
      </Card>
      <DashboardTable
        title="Latest receptionist bookings"
        emptyText="No receptionist bookings yet."
        bookings={latestReceptionistBookings}
        showCreated
      />
    </div>
  );
}

type DashboardBooking = {
  id: string;
  bookingCode: string;
  startDateTime: Date;
  createdAt: Date;
  status: string;
  client: { fullName: string };
  service: { name: string };
  payment: { paymentStatus: string } | null;
  bookedBy: { name: string } | null;
};

function DashboardTable({
  title,
  emptyText,
  bookings,
  showCreated,
}: {
  title: string;
  emptyText: string;
  bookings: DashboardBooking[];
  showCreated?: boolean;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>Code</Th><Th>Client</Th><Th>Service</Th><Th>Date</Th><Th>Status</Th><Th>Payment</Th><Th>Booked By</Th>{showCreated ? <Th>Created</Th> : null}<Th></Th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <Td>{booking.bookingCode}</Td>
                <Td>{booking.client.fullName}</Td>
                <Td>{booking.service.name}</Td>
                <Td>{shortDateTime(booking.startDateTime)}</Td>
                <Td><StatusBadge status={booking.status} /></Td>
                <Td>{booking.payment ? <StatusBadge status={booking.payment.paymentStatus} /> : null}</Td>
                <Td>{booking.bookedBy?.name || "Online Client"}</Td>
                {showCreated ? <Td>{shortDateTime(booking.createdAt)}</Td> : null}
                <Td><Link className="font-semibold text-primary" href={`/admin/bookings/${booking.id}`}>Open</Link></Td>
              </tr>
            ))}
            {bookings.length === 0 ? (
              <tr><Td colSpan={showCreated ? 9 : 8} className="text-center text-muted-foreground">{emptyText}</Td></tr>
            ) : null}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}
