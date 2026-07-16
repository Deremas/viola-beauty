import Link from "next/link";
import { Eye, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { shortDateTime } from "@/lib/format";
import { StatusBadge } from "@/lib/status";
import { setClientActive, deleteClient } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function ClientsPage() {
  await requirePermission("VIEW_CLIENTS");
  const clients = await prisma.client.findMany({
    include: {
      _count: { select: { bookings: true, tasks: true } },
      bookings: { orderBy: { startDateTime: "desc" }, take: 1, include: { service: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">Customer profiles are created from bookings and can be enriched by staff.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Customer list</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th className="min-w-[16rem]">Name</Th>
                <Th>Phone</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Bookings</Th>
                <Th>Tasks</Th>
                <Th>Last service</Th>
                <Th>Created</Th>
                <Th className="min-w-[14rem]">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const latestBooking = client.bookings[0];
                return (
                  <tr key={client.id}>
                    <Td>
                      <div className="font-semibold">{client.fullName}</div>
                      {client.preferences ? <div className="mt-1 text-xs text-muted-foreground">{client.preferences}</div> : null}
                    </Td>
                    <Td>{client.phone}</Td>
                    <Td>{client.email || "Not set"}</Td>
                    <Td><StatusBadge status={client.isActive ? "ACTIVE" : "INACTIVE"} /></Td>
                    <Td>{client._count.bookings}</Td>
                    <Td>{client._count.tasks}</Td>
                    <Td>{latestBooking ? latestBooking.service.name : "None yet"}</Td>
                    <Td>{shortDateTime(client.createdAt)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="icon" title="View client">
                          <Link href={`/admin/clients/${client.id}`} aria-label={`View ${client.fullName}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button asChild variant="outline" size="icon" title="Edit client">
                          <Link href={`/admin/clients/${client.id}/edit`} aria-label={`Edit ${client.fullName}`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        <form action={setClientActive}>
                          <input type="hidden" name="id" value={client.id} />
                          <input type="hidden" name="isActive" value={client.isActive ? "false" : "true"} />
                          <Button variant="outline" size="icon" type="submit" title={client.isActive ? "Deactivate client" : "Activate client"} aria-label={client.isActive ? `Deactivate ${client.fullName}` : `Activate ${client.fullName}`}>
                            {client.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        </form>
                        <form action={deleteClient}>
                          <input type="hidden" name="id" value={client.id} />
                          <Button variant="destructive" size="icon" type="submit" title="Delete client" aria-label={`Delete ${client.fullName}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {clients.length === 0 ? (
                <tr><Td colSpan={9} className="text-center text-muted-foreground">No clients yet.</Td></tr>
              ) : null}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
