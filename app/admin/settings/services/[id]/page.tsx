import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { formatDuration, money, shortDateTime } from "@/lib/format";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ViewServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("MANAGE_SERVICES");
  const { id } = await params;
  const service = await prisma.service.findUnique({
    where: { id, deletedAt: null },
    include: { image: { select: { id: true } }, _count: { select: { bookings: true } } },
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
          {service.image ? <Image unoptimized width={960} height={420} src={`/api/public/services/${service.id}/image`} alt={`${service.name} service`} className="aspect-[16/7] w-full rounded-xl object-cover sm:col-span-2" /> : null}
          <Detail label="Client visibility" value={<StatusBadge status={service.isActive ? "ACTIVE" : "INACTIVE"} />} />
          <Detail label="Category" value={service.category || "Not set"} />
          <Detail label="Full price" value={money(service.price)} />
          <Detail label="Required advance" value={money(service.advanceAmount)} />
          <Detail label="Service time" value={formatDuration(service.durationMinutes)} />
          <Detail label="Gap between services" value={`${service.bufferMinutes} min`} />
          <Detail label="Bookings using this service" value={service._count.bookings} />
          <Detail label="Created" value={shortDateTime(service.createdAt)} />
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">Client-facing description</p>
            <div className="mt-1 rounded-lg border bg-background/70 p-3 font-medium">
              {service.description || "No description set."}
            </div>
          </div>
          <div className="sm:col-span-2 rounded-xl border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">Booking precaution pop-up</p><StatusBadge status={service.bookingWarningActive ? "ACTIVE" : "INACTIVE"} /></div>
            <p className="mt-3 font-semibold">{service.bookingWarningTitle || service.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{service.bookingWarningIntro || "No introduction set."}</p>
            {service.bookingWarningInstructions ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{service.bookingWarningInstructions.split(/\r?\n/).filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul> : null}
            {service.bookingWarningContact ? <p className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"><strong>Contact Viola before attending:</strong> {service.bookingWarningContact}</p> : null}
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
