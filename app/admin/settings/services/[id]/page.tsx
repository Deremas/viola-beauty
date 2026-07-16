import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { money } from "@/lib/format";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ViewServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("MANAGE_SERVICES");
  const { id } = await params;
  const service = await prisma.service.findUnique({
    where: { id, deletedAt: null },
    include: { _count: { select: { bookings: true } } },
  });
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/settings/services">
            <ArrowLeft className="h-4 w-4" />
            Back to services
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/admin/settings/services/${service.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit service
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{service.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label="Client visibility" value={<StatusBadge status={service.isActive ? "ACTIVE" : "INACTIVE"} />} />
          <Detail label="Category" value={service.category || "Not set"} />
          <Detail label="Full price" value={money(service.price)} />
          <Detail label="Required advance" value={money(service.advanceAmount)} />
          <Detail label="Service time" value={`${service.durationMinutes} min`} />
          <Detail label="Gap between services" value={`${service.bufferMinutes} min`} />
          <Detail label="Bookings using this service" value={service._count.bookings} />
          <Detail label="Created" value={service.createdAt.toLocaleString("en-US")} />
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">Client-facing description</p>
            <div className="mt-1 rounded-lg border bg-background/70 p-3 font-medium">
              {service.description || "No description set."}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  );
}
