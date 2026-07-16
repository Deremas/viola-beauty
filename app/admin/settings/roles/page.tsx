import Link from "next/link";
import { Archive, Pencil, Plus, Power, PowerOff, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { StatusBadge } from "@/lib/status";
import { archiveStaffRole, restoreStaffRole, setStaffRoleActive } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function RolesPage() {
  await requirePermission("MANAGE_ROLES");
  const roles = await prisma.staffRole.findMany({ include: { permissions: true, _count: { select: { users: true } } }, orderBy: [{ deletedAt: "asc" }, { name: "asc" }] });
  const current = roles.filter((role) => !role.deletedAt); const archived = roles.filter((role) => role.deletedAt);
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-3xl font-bold">Staff roles</h1><p className="text-sm text-muted-foreground">Create reusable permission sets and assign them to staff users.</p></div><Button asChild><Link href="/admin/settings/roles/create"><Plus className="h-4 w-4" />Add staff role</Link></Button></div>
    <Card><CardHeader><CardTitle>Current roles</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><thead><tr><Th className="min-w-52">Role</Th><Th>Permissions</Th><Th>Assigned staff</Th><Th>Status</Th><Th>Actions</Th></tr></thead><tbody>{current.map((role) => <tr key={role.id}><Td><p className="font-semibold">{role.name}</p><p className="max-w-xs text-xs text-muted-foreground">{role.description || "No description"}</p></Td><Td>{role.permissions.length}</Td><Td>{role._count.users}</Td><Td><StatusBadge status={role.isActive ? "ACTIVE" : "INACTIVE"} /></Td><Td><div className="flex gap-2"><Button asChild variant="outline" size="icon" title="Edit role"><Link href={`/admin/settings/roles/${role.id}/edit`}><Pencil className="h-4 w-4" /><span className="sr-only">Edit role</span></Link></Button><form action={setStaffRoleActive}><input type="hidden" name="id" value={role.id} /><input type="hidden" name="isActive" value={role.isActive ? "false" : "true"} /><Button type="submit" variant="outline" size="icon" title={role.isActive ? "Deactivate role" : "Activate role"}>{role.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}<span className="sr-only">Change role status</span></Button></form><form action={archiveStaffRole}><input type="hidden" name="id" value={role.id} /><Button type="submit" variant="destructive" size="icon" title="Archive role"><Archive className="h-4 w-4" /><span className="sr-only">Archive role</span></Button></form></div></Td></tr>)}{current.length === 0 ? <tr><Td colSpan={5} className="text-center text-muted-foreground">No custom roles found.</Td></tr> : null}</tbody></Table></CardContent></Card>
    {archived.length ? <Card><CardHeader><CardTitle>Archived roles</CardTitle></CardHeader><CardContent><div className="space-y-2">{archived.map((role) => <div key={role.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-semibold">{role.name}</p><p className="text-xs text-muted-foreground">{role.permissions.length} permissions</p></div><form action={restoreStaffRole}><input type="hidden" name="id" value={role.id} /><Button type="submit" variant="outline" size="icon" title="Restore role"><RotateCcw className="h-4 w-4" /><span className="sr-only">Restore role</span></Button></form></div>)}</div></CardContent></Card> : null}
  </div>;
}
