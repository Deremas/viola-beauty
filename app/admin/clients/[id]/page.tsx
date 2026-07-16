import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money, shortDateTime } from "@/lib/format";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function ClientViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          service: true,
          payment: { select: { paymentStatus: true, requiredAdvanceAmount: true } },
          bookedBy: true,
        },
        orderBy: { startDateTime: "desc" },
      },
      tasks: {
        include: { assignedTo: true, createdBy: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/clients"><ArrowLeft className="h-4 w-4" />Back to clients</Link>
        </Button>
        <Button asChild>
          <Link href={`/admin/clients/${client.id}/edit`}><Pencil className="h-4 w-4" />Edit client</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>{client.fullName}</CardTitle></CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-2">
          <InfoTable
            title="Contact"
            rows={[
              ["Status", <StatusBadge key="status" status={client.isActive ? "ACTIVE" : "INACTIVE"} />],
              ["Phone", client.phone],
              ["Other phone", client.alternatePhone || "Not set"],
              ["Email", client.email || "Not set"],
              ["Address", client.address || "Not set"],
              ["Birthday", client.birthDate ? client.birthDate.toLocaleDateString("en-US") : "Not set"],
              ["How they found us", client.source || "Not set"],
            ]}
          />
          <InfoTable
            title="Client notes"
            rows={[
              ["Preferences", client.preferences || "Not set"],
              ["Allergies / cautions", client.allergies || "Not set"],
              ["Client note", client.note || "No note"],
              ["Staff note", client.internalNote || "No staff note"],
              ["Created", shortDateTime(client.createdAt)],
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Booking history</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Code</Th><Th>Service</Th><Th>Date</Th><Th>Status</Th><Th>Payment</Th><Th>Advance</Th><Th></Th></tr></thead>
            <tbody>
              {client.bookings.map((booking) => (
                <tr key={booking.id}>
                  <Td>{booking.bookingCode}</Td>
                  <Td>{booking.service.name}</Td>
                  <Td>{shortDateTime(booking.startDateTime)}</Td>
                  <Td><StatusBadge status={booking.status} /></Td>
                  <Td>{booking.payment ? <StatusBadge status={booking.payment.paymentStatus} /> : "No payment"}</Td>
                  <Td>{booking.payment ? money(booking.payment.requiredAdvanceAmount) : "N/A"}</Td>
                  <Td><Link className="font-semibold text-primary" href={`/admin/bookings/${booking.id}`}>Open</Link></Td>
                </tr>
              ))}
              {client.bookings.length === 0 ? <tr><Td colSpan={7} className="text-center text-muted-foreground">No bookings yet.</Td></tr> : null}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Staff tasks for this client</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Task</Th><Th>Status</Th><Th>Priority</Th><Th>Assigned to</Th><Th>Due</Th></tr></thead>
            <tbody>
              {client.tasks.map((task) => (
                <tr key={task.id}>
                  <Td>{task.title}</Td>
                  <Td><StatusBadge status={task.status} /></Td>
                  <Td>{task.priority}</Td>
                  <Td>{task.assignedTo?.name || "Unassigned"}</Td>
                  <Td>{task.dueAt ? shortDateTime(task.dueAt) : "No due date"}</Td>
                </tr>
              ))}
              {client.tasks.length === 0 ? <tr><Td colSpan={5} className="text-center text-muted-foreground">No tasks for this client.</Td></tr> : null}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoTable({ title, rows }: { title: string; rows: Array<[string, ReactNode]> }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="border-b bg-background px-3 py-2 font-semibold">{title}</div>
      <Table>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <Td className="w-44 bg-background/60 text-muted-foreground">{label}</Td>
              <Td className="font-medium">{value}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
