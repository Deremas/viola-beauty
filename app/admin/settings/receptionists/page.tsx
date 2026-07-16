import Link from "next/link";
import { Eye, Pencil, Plus, Power, PowerOff, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { StatusBadge } from "@/lib/status";
import { setUserActive } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function ReceptionistsPage() {
  await requirePermission("MANAGE_STAFF");
  const receptionists = await prisma.user.findMany({ where: { role: "RECEPTIONIST", deletedAt: null }, include: { staffRole: { include: { permissions: true } }, _count: { select: { createdBookings: true, assignedTasks: true } } }, orderBy: { name: "asc" } });
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-3xl font-bold">Receptionists</h1><p className="text-sm text-muted-foreground">Manage receptionist logins and see the role assigned to each person.</p></div><div className="flex gap-2"><Button asChild variant="outline"><Link href="/admin/settings/roles"><ShieldCheck className="h-4 w-4" />Manage roles</Link></Button><Button asChild><Link href="/admin/settings/receptionists/create"><Plus className="h-4 w-4" />Add receptionist</Link></Button></div></div>
    <Card><CardHeader><CardTitle>Receptionist list</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><thead><tr><Th className="min-w-52">Name</Th><Th>Username</Th><Th>Phone</Th><Th>Assigned role</Th><Th>Permissions</Th><Th>Bookings created</Th><Th>Tasks</Th><Th>Status</Th><Th>Actions</Th></tr></thead><tbody>{receptionists.map((user) => <tr key={user.id}><Td><p className="font-semibold">{user.name}</p><p className="text-xs text-muted-foreground">{user.email || "No email"}</p></Td><Td>{user.username}</Td><Td>{user.phone || "Not set"}</Td><Td>{user.staffRole?.name || "Receptionist default"}</Td><Td>{user.staffRole?.permissions.length ?? "Default"}</Td><Td>{user._count.createdBookings}</Td><Td>{user._count.assignedTasks}</Td><Td><StatusBadge status={user.isActive ? "ACTIVE" : "INACTIVE"} /></Td><Td><div className="flex gap-2"><Button asChild variant="outline" size="icon" title="View receptionist"><Link href={`/admin/settings/users/${user.id}`}><Eye className="h-4 w-4" /><span className="sr-only">View receptionist</span></Link></Button><Button asChild variant="outline" size="icon" title="Edit receptionist"><Link href={`/admin/settings/users/${user.id}/edit`}><Pencil className="h-4 w-4" /><span className="sr-only">Edit receptionist</span></Link></Button><form action={setUserActive}><input type="hidden" name="id" value={user.id} /><input type="hidden" name="isActive" value={user.isActive ? "false" : "true"} /><Button type="submit" variant="outline" size="icon" title={user.isActive ? "Deactivate receptionist" : "Activate receptionist"}>{user.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}<span className="sr-only">Change receptionist status</span></Button></form></div></Td></tr>)}{receptionists.length === 0 ? <tr><Td colSpan={9} className="text-center text-muted-foreground">No receptionists found.</Td></tr> : null}</tbody></Table></CardContent></Card>
  </div>;
}

