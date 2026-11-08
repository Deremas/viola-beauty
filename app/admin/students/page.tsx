import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { Table, Td, Th } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  await requirePermission("VIEW_STUDENTS");
  const students = await prisma.student.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { registrations: true } } }, take: 200 });
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Students</h1><p className="text-sm text-muted-foreground">A student profile is reused when the same phone number registers again.</p></div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <thead><tr><Th>Name</Th><Th>Phone</Th><Th>Registrations</Th></tr></thead>
          <tbody>{students.map((student) => <tr key={student.id} className="hover:bg-muted/60"><Td>{student.fullName}</Td><Td>{student.phone}</Td><Td><Link className="font-semibold text-brand" href={`/admin/registrations?q=${student.phone}`}>{student._count.registrations}</Link></Td></tr>)}</tbody>
        </Table>
        {students.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No students yet.</p> : null}
      </div>
    </div>
  );
}
