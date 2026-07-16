import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td } from "@/components/ui/table";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("MANAGE_STAFF");
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: {
      staffRole: { include: { permissions: true } },
      _count: { select: { createdBookings: true, assignedTasks: true } },
    },
  });
  if (!user) notFound();
  const access = user.role === "ADMIN" ? "Administrator - full ownership" : user.staffRole?.name || "Receptionist default";
  const rows = [
    ["Full name", user.name], ["Username", user.username], ["Phone", user.phone || "Not set"],
    ["Email", user.email || "Not set"], ["Access", access],
    ["Bookings created", String(user._count.createdBookings)], ["Tasks assigned", String(user._count.assignedTasks)],
  ];
  return <div className="mx-auto max-w-3xl space-y-6"><div className="flex justify-between gap-3"><Button asChild variant="outline"><Link href={user.role === "RECEPTIONIST" ? "/admin/settings/receptionists" : "/admin/settings/users"}><ArrowLeft className="h-4 w-4" />Back to staff list</Link></Button><Button asChild><Link href={`/admin/settings/users/${id}/edit`}><Pencil className="h-4 w-4" />Edit user</Link></Button></div><Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{user.name}</CardTitle><StatusBadge status={user.isActive ? "ACTIVE" : "INACTIVE"} /></div></CardHeader><CardContent><Table><tbody>{rows.map(([label, value]) => <tr key={label}><Td className="w-48 bg-background text-muted-foreground">{label}</Td><Td className="font-medium">{value}</Td></tr>)}</tbody></Table>{user.staffRole ? <div className="mt-5"><p className="mb-2 font-semibold">Role permissions</p><div className="flex flex-wrap gap-2">{user.staffRole.permissions.map((item) => <span key={item.id} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{item.permission.replaceAll("_", " ")}</span>)}</div></div> : null}</CardContent></Card></div>;
}
