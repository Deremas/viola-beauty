import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { StaffRegistrationForm } from "@/components/admin/staff-registration-form";

export const dynamic = "force-dynamic";

export default async function NewRegistrationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("CREATE_REGISTRATIONS");
  const query = await searchParams;
  const courses = await prisma.course.findMany({
    where: { publicationStatus: "PUBLISHED", registrationOpen: true },
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm"><Link href="/admin/registrations" className="font-semibold text-brand">Registrations</Link></p>
        <h1 className="font-display text-3xl font-bold">Add registration</h1>
        <p className="text-sm text-muted-foreground">This saves a request for a published course. Payment and class progress stay unset until staff record them.</p>
      </div>
      {courses.length === 0 ? <p className="rounded-lg border bg-white p-5 text-sm text-muted-foreground">Publish a course and open registration before adding a student here.</p> : <StaffRegistrationForm courses={courses} error={query.error} />}
    </div>
  );
}
