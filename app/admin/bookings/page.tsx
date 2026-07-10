import Link from "next/link";
import { Plus } from "lucide-react";
import { endOfDay, startOfDay } from "date-fns";
import { BookingSource, BookingStatus, PaymentStatus, UserRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatStatus, shortDateTime } from "@/lib/format";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const paymentStatus = typeof params.paymentStatus === "string" ? params.paymentStatus : "";
  const source = typeof params.source === "string" ? params.source : "";
  const serviceId = typeof params.serviceId === "string" ? params.serviceId : "";
  const phone = typeof params.phone === "string" ? params.phone : "";
  const client = typeof params.client === "string" ? params.client : "";
  const receptionistId = typeof params.receptionistId === "string" ? params.receptionistId : "";
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : "";
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : "";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const pageSize = 20;

  const where: Prisma.BookingWhereInput = {
    status: status ? (status as BookingStatus) : undefined,
    source: source ? (source as BookingSource) : undefined,
    serviceId: serviceId || undefined,
    bookedByUserId: receptionistId || undefined,
    startDateTime: dateFrom || dateTo
      ? {
          gte: dateFrom ? startOfDay(new Date(`${dateFrom}T00:00:00`)) : undefined,
          lte: dateTo ? endOfDay(new Date(`${dateTo}T00:00:00`)) : undefined,
        }
      : undefined,
    payment: paymentStatus ? { paymentStatus: paymentStatus as PaymentStatus } : undefined,
    client: {
      phone: phone ? { contains: phone } : undefined,
      fullName: client ? { contains: client, mode: "insensitive" } : undefined,
    },
  };

  const [bookings, totalBookings, services, receptionists] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { client: true, service: true, payment: true, bookedBy: true },
      orderBy: { startDateTime: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.booking.count({ where }),
    prisma.service.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: UserRole.RECEPTIONIST, isActive: true }, orderBy: { name: "asc" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalBookings / pageSize));
  const fromCount = totalBookings === 0 ? 0 : (page - 1) * pageSize + 1;
  const toCount = Math.min(page * pageSize, totalBookings);

  function pageHref(nextPage: number) {
    const nextParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value && key !== "page") nextParams.set(key, value);
    }
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    const query = nextParams.toString();
    return query ? `/admin/bookings?${query}` : "/admin/bookings";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Bookings</h1>
        <Button asChild><Link href="/admin/bookings/create"><Plus className="h-4 w-4" />Create booking</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Input name="client" placeholder="Client name" defaultValue={client} />
            <Input name="phone" placeholder="Phone" defaultValue={phone} />
            <Input name="dateFrom" type="date" defaultValue={dateFrom} aria-label="Date from" />
            <Input name="dateTo" type="date" defaultValue={dateTo} aria-label="Date to" />
            <Select name="status" defaultValue={status}>
              <option value="">Any status</option>
              {Object.values(BookingStatus).map((item) => <option key={item} value={item}>{formatStatus(item)}</option>)}
            </Select>
            <Select name="paymentStatus" defaultValue={paymentStatus}>
              <option value="">Any payment</option>
              {Object.values(PaymentStatus).map((item) => <option key={item} value={item}>{formatStatus(item)}</option>)}
            </Select>
            <Select name="source" defaultValue={source}>
              <option value="">Any source</option>
              {Object.values(BookingSource).map((item) => <option key={item} value={item}>{formatStatus(item)}</option>)}
            </Select>
            <Select name="serviceId" defaultValue={serviceId}>
              <option value="">Any service</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </Select>
            <Select name="receptionistId" defaultValue={receptionistId}>
              <option value="">Any receptionist</option>
              {receptionists.map((receptionist) => <option key={receptionist.id} value={receptionist.id}>{receptionist.name}</option>)}
            </Select>
            <Button type="submit">Apply booking filters</Button>
            <Button asChild type="button" variant="outline"><Link href="/admin/bookings">Clear booking filters</Link></Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Bookings</CardTitle>
            <p className="text-sm text-muted-foreground">Showing {fromCount}-{toCount} of {totalBookings}</p>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Code</Th><Th>Client</Th><Th>Phone</Th><Th>Service</Th><Th>Date</Th><Th>Status</Th><Th>Payment</Th><Th>Source</Th><Th>Booked By</Th><Th></Th></tr></thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <Td>{booking.bookingCode}</Td>
                  <Td>{booking.client.fullName}</Td>
                  <Td>{booking.client.phone}</Td>
                  <Td>{booking.service.name}</Td>
                  <Td>{shortDateTime(booking.startDateTime)}</Td>
                  <Td><StatusBadge status={booking.status} /></Td>
                  <Td>{booking.payment ? <StatusBadge status={booking.payment.paymentStatus} /> : null}</Td>
                  <Td>{booking.source}</Td>
                  <Td>{booking.bookedBy?.name || "Online Client"}</Td>
                  <Td><Link className="font-semibold text-primary" href={`/admin/bookings/${booking.id}`}>Open</Link></Td>
                </tr>
              ))}
              {bookings.length === 0 ? (
                <tr>
                  <Td colSpan={10} className="text-center text-muted-foreground">No bookings match these filters.</Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page <= 1 ? (
                <Button variant="outline" size="sm" disabled>Previous</Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageHref(page - 1)}>Previous</Link>
                </Button>
              )}
              {page >= totalPages ? (
                <Button variant="outline" size="sm" disabled>Next</Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageHref(page + 1)}>Next</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
