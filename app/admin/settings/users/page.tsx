import { prisma } from "@/lib/prisma";
import { createUser } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1fr]">
      <Card><CardHeader><CardTitle>Add staff user</CardTitle></CardHeader><CardContent>
        <form action={createUser} className="grid gap-3">
          <Input name="name" placeholder="Name" required />
          <Input name="phone" placeholder="Phone" />
          <Input name="email" type="email" placeholder="Email" />
          <Input name="username" placeholder="Username" required />
          <Input name="password" type="password" placeholder="Password" required />
          <Select name="role" defaultValue="RECEPTIONIST"><option value="RECEPTIONIST">Receptionist</option><option value="ADMIN">Admin</option></Select>
          <Label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked /> Active</Label>
          <Button type="submit">Create staff user</Button>
        </form>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Users</CardTitle></CardHeader><CardContent className="overflow-x-auto">
        <Table><thead><tr><Th>Name</Th><Th>Username</Th><Th>Role</Th><Th>Active</Th></tr></thead><tbody>
          {users.map((user) => <tr key={user.id}><Td>{user.name}</Td><Td>{user.username}</Td><Td>{user.role}</Td><Td>{user.isActive ? "Yes" : "No"}</Td></tr>)}
        </tbody></Table>
      </CardContent></Card>
    </div>
  );
}
