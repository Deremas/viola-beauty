import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { money, shortDateTime } from "@/lib/format";
import { StatusBadge } from "@/lib/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function PaymentsPage() {
  await requirePermission("VIEW_PAYMENTS");
  const payments = await prisma.payment.findMany({
    select: {
      id: true,
      bookingId: true,
      requiredAdvanceAmount: true,
      paymentStatus: true,
      createdAt: true,
      booking: { include: { client: true, service: true } },
      bankAccount: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <Card>
      <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <thead><tr><Th>Booking</Th><Th>Client</Th><Th>Service</Th><Th>Advance</Th><Th>Status</Th><Th>Bank</Th><Th>Uploaded</Th><Th></Th></tr></thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <Td>{payment.booking.bookingCode}</Td>
                <Td>{payment.booking.client.fullName}</Td>
                <Td>{payment.booking.service.name}</Td>
                <Td>{money(payment.requiredAdvanceAmount)}</Td>
                <Td><StatusBadge status={payment.paymentStatus} /></Td>
                <Td>{payment.bankAccount?.bankName || ""}</Td>
                <Td>{shortDateTime(payment.createdAt)}</Td>
                <Td><Link className="font-semibold text-primary" href={`/admin/bookings/${payment.bookingId}`}>Review</Link></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}
