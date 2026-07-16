import type { PermissionKey, RolePermission, StaffRole } from "@prisma/client";
import { permissionCatalog } from "@/lib/permission-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RoleWithPermissions = StaffRole & { permissions: RolePermission[] };

export function StaffRoleForm({ role, action, submitLabel }: { role?: RoleWithPermissions; action: (formData: FormData) => Promise<void>; submitLabel: string }) {
  const selected = new Set<PermissionKey>(role?.permissions.map((item) => item.permission) || []);
  const groups = [...new Set(permissionCatalog.map((item) => item.group))];
  return <form action={action} className="grid gap-5">
    {role ? <input type="hidden" name="id" value={role.id} /> : null}
    <div className="grid gap-4 sm:grid-cols-2"><div><Label className="mb-2 block">Role name</Label><Input name="name" defaultValue={role?.name || ""} placeholder="Senior Receptionist" required /></div><div><Label className="mb-2 block">Description</Label><Textarea name="description" defaultValue={role?.description || ""} placeholder="What this role is responsible for" /></div></div>
    <div><h2 className="text-lg font-semibold">Permissions</h2><p className="text-sm text-muted-foreground">Choose exactly what staff assigned to this role can access.</p></div>
    <div className="grid gap-4 lg:grid-cols-2">{groups.map((group) => <fieldset key={group} className="rounded-lg border p-4"><legend className="px-2 font-semibold">{group}</legend><div className="grid gap-3">{permissionCatalog.filter((item) => item.group === group).map((item) => <Label key={item.key} className="flex items-start gap-3 rounded-md p-2 hover:bg-muted"><input className="mt-1" name="permissions" type="checkbox" value={item.key} defaultChecked={selected.has(item.key)} /><span><span className="block font-medium">{item.label}</span><span className="block text-xs font-normal leading-5 text-muted-foreground">{item.description}</span></span></Label>)}</div></fieldset>)}</div>
    <Label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked={role?.isActive ?? true} />This role can be assigned to staff</Label>
    <div className="flex justify-end"><Button type="submit">{submitLabel}</Button></div>
  </form>;
}

