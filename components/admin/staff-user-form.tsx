import type { User, StaffRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function StaffUserForm({ user, roles, action, submitLabel, staffOnly = false }: { user?: User; roles: StaffRole[]; action: (formData: FormData) => Promise<void>; submitLabel: string; staffOnly?: boolean }) {
  return <form action={action} className="grid gap-4">
    {user ? <input type="hidden" name="id" value={user.id} /> : null}
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><Input name="name" defaultValue={user?.name || ""} required /></Field><Field label="Phone number"><Input name="phone" type="tel" defaultValue={user?.phone || ""} /></Field></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Email optional"><Input name="email" type="email" defaultValue={user?.email || ""} /></Field><Field label="Username"><Input name="username" defaultValue={user?.username || ""} autoComplete="off" required /></Field></div>
    <Field label={user ? "New password optional" : "Password"}><Input name="password" type="password" autoComplete="new-password" required={!user} minLength={4} placeholder={user ? "Leave blank to keep current password" : "Create a secure password"} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">{staffOnly ? <input type="hidden" name="accountType" value="RECEPTIONIST" /> : <Field label="Account type"><Select name="accountType" defaultValue={user?.role || "RECEPTIONIST"}><option value="RECEPTIONIST">Staff member</option><option value="ADMIN">Administrator - full ownership</option></Select></Field>}<Field label="Staff role"><Select name="staffRoleId" defaultValue={user?.staffRoleId || ""}><option value="">Receptionist default permissions</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></Field></div>
    <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">Administrators always have full access. The selected staff role applies to non-administrator accounts.</p>
    <Label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked={user?.isActive ?? true} />Allow this user to sign in</Label>
    <div className="flex justify-end"><Button type="submit">{submitLabel}</Button></div>
  </form>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label className="mb-2 block">{label}</Label>{children}</div>; }
