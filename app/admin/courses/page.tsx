import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { formatStatus } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  await requirePermission("VIEW_COURSES");
  const courses = await prisma.course.findMany({ orderBy: { displayOrder: "asc" }, include: { _count: { select: { registrations: true } } } });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Courses</h1>
        <p className="text-sm text-muted-foreground">Published courses appear on the website. Fees stay hidden until “show fee” is turned on.</p>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <thead><tr><Th>Course</Th><Th>Level</Th><Th>Status</Th><Th>Registration</Th><Th>Students</Th><Th></Th></tr></thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-muted/60">
                <Td>{course.name}<span className="block text-xs text-muted-foreground">{course.code}</span></Td>
                <Td>{formatStatus(course.skillLevel)}</Td>
                <Td>{formatStatus(course.publicationStatus)}</Td>
                <Td>{course.registrationOpen ? "Open" : "Closed"}</Td>
                <Td>{course._count.registrations}</Td>
                <Td className="text-right"><Button asChild size="sm" variant="outline"><Link href={`/admin/courses/${course.id}`}>Edit</Link></Button></Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {courses.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No courses yet. Run the course catalog seed before publishing fees.</p> : null}
      </div>
    </div>
  );
}
