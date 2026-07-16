import Link from "next/link";
import { Archive, Eye, KeyRound, Pencil, Plus, Power, PowerOff, RotateCcw, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { StatusBadge } from "@/lib/status";
import { archiveUser, restoreUser, setUserActive } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function UsersPage() {
  await requirePermission("MANAGE_STAFF");
  const users = await prisma.user.findMany({ include: { staffRole: true }, orderBy: [{ deletedAt: "asc" }, { name: "asc" }] });
  const current = users.filter((user) => !user.deletedAt);
  const archived = users.filter((user) => user.deletedAt);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-3xl font-bold">Staff users</h1><p className="text-sm text-muted-foreground">Manage administrators, receptionists, login credentials, and access roles.</p></div><div className="flex gap-2"><Button asChild variant="outline"><Link href="/admin/settings/roles"><ShieldCheck className="h-4 w-4" />Manage roles</Link></Button><Button asChild><Link href="/admin/settings/users/create"><Plus className="h-4 w-4" />Add staff user</Link></Button></div></div>
    <Card><CardHeader><CardTitle>Current staff</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><thead><tr><Th className="min-w-52">Name</Th><Th>Login</Th><Th>Phone</Th><Th>Access role</Th><Th>Status</Th><Th className="min-w-60">Actions</Th></tr></thead><tbody>
      {current.map((user) => <tr key={user.id}><Td><p className="font-semibold">{user.name}</p><p className="text-xs text-muted-foreground">{user.email || "No email"}</p></Td><Td>{user.username}</Td><Td>{user.phone || "Not set"}</Td><Td>{user.role === "ADMIN" ? "Administrator" : user.staffRole?.name || "Receptionist default"}</Td><Td><StatusBadge status={user.isActive ? "ACTIVE" : "INACTIVE"} /></Td><Td><div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon" title="View staff user"><Link href={`/admin/settings/users/${user.id}`}><Eye className="h-4 w-4" /><span className="sr-only">View staff user</span></Link></Button>
        <Button asChild variant="outline" size="icon" title="Edit staff user or reset password"><Link href={`/admin/settings/users/${user.id}/edit`}><Pencil className="h-4 w-4" /><span className="sr-only">Edit staff user</span></Link></Button>
        <form action={setUserActive}><input type="hidden" name="id" value={user.id} /><input type="hidden" name="isActive" value={user.isActive ? "false" : "true"} /><Button type="submit" variant="outline" size="icon" title={user.isActive ? "Deactivate user" : "Activate user"}>{user.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}<span className="sr-only">Change user status</span></Button></form>
        <form action={archiveUser}><input type="hidden" name="id" value={user.id} /><Button type="submit" variant="destructive" size="icon" title="Archive staff user"><Archive className="h-4 w-4" /><span className="sr-only">Archive staff user</span></Button></form>
      </div></Td></tr>)}
      {current.length === 0 ? <tr><Td colSpan={6} className="text-center text-muted-foreground">No staff users found.</Td></tr> : null}
    </tbody></Table></CardContent></Card>
    {archived.length ? <Card><CardHeader><CardTitle>Archived staff</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><thead><tr><Th>Name</Th><Th>Username</Th><Th>Previous role</Th><Th>Action</Th></tr></thead><tbody>{archived.map((user) => <tr key={user.id}><Td>{user.name}</Td><Td>{user.username}</Td><Td>{user.role === "ADMIN" ? "Administrator" : user.staffRole?.name || "Receptionist"}</Td><Td><form action={restoreUser}><input type="hidden" name="id" value={user.id} /><Button type="submit" variant="outline" size="icon" title="Restore staff user"><RotateCcw className="h-4 w-4" /><span className="sr-only">Restore staff user</span></Button></form></Td></tr>)}</tbody></Table></CardContent></Card> : null}
  </div>;
}
