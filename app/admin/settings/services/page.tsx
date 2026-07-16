import Link from "next/link";
import { Archive, Eye, Pencil, Plus, Power, PowerOff, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { money } from "@/lib/format";
import { StatusBadge } from "@/lib/status";
import { deleteService, restoreService, setServiceActive } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function ServicesSettingsPage() {
  await requirePermission("MANAGE_SERVICES");
  const allServices = await prisma.service.findMany({ orderBy: { name: "asc" } });
  const services = allServices.filter((service) => !service.deletedAt);
  const archivedServices = allServices.filter((service) => service.deletedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Services</h1>
          <p className="text-sm text-muted-foreground">All services are loaded from the database and shown to clients when active.</p>
        </div>
        <Button asChild>
          <Link href="/admin/settings/services/create">
            <Plus className="h-4 w-4" />
            Add service
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service list</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th className="min-w-[18rem] md:w-[22rem]">Name</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Advance</Th>
                <Th>Service time</Th>
                <Th>Gap between services</Th>
                <Th>Client visibility</Th>
                <Th className="min-w-[14rem]">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <Td className="min-w-[18rem] md:w-[22rem]">
                    <div className="font-semibold">{service.name}</div>
                    {service.description ? (
                      <div className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{service.description}</div>
                    ) : null}
                  </Td>
                  <Td>{service.category || "Not set"}</Td>
                  <Td>{money(service.price)}</Td>
                  <Td>{money(service.advanceAmount)}</Td>
                  <Td>{service.durationMinutes} min</Td>
                  <Td>{service.bufferMinutes} min</Td>
                  <Td><StatusBadge status={service.isActive ? "ACTIVE" : "INACTIVE"} /></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="icon" title="View service">
                        <Link href={`/admin/settings/services/${service.id}`} aria-label={`View ${service.name}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="icon" title="Edit service">
                        <Link href={`/admin/settings/services/${service.id}/edit`} aria-label={`Edit ${service.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                      <form action={setServiceActive}>
                        <input type="hidden" name="id" value={service.id} />
                        <input type="hidden" name="isActive" value={service.isActive ? "false" : "true"} />
                        <Button
                          variant="outline"
                          size="icon"
                          type="submit"
                          title={service.isActive ? "Deactivate service" : "Activate service"}
                          aria-label={service.isActive ? `Deactivate ${service.name}` : `Activate ${service.name}`}
                        >
                          {service.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                      </form>
                      <form action={deleteService}>
                        <input type="hidden" name="id" value={service.id} />
                        <Button
                          variant="destructive"
                          size="icon"
                          type="submit"
                          title="Archive service"
                          aria-label={`Archive ${service.name}`}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </Td>
                </tr>
              ))}
              {services.length === 0 ? (
                <tr>
                  <Td colSpan={8} className="text-center text-muted-foreground">
                    No services have been created yet.
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </CardContent>
      </Card>
      {archivedServices.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Archived services</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {archivedServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="font-semibold">{service.name}</p><p className="text-xs text-muted-foreground">Historical bookings are preserved.</p></div>
                <form action={restoreService}><input type="hidden" name="id" value={service.id} /><Button type="submit" variant="outline" size="icon" title="Restore service"><RotateCcw className="h-4 w-4" /><span className="sr-only">Restore service</span></Button></form>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
