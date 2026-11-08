import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { addModule, addTopic, deleteModule, deleteTopic, moveModule, saveCourse } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("MANAGE_COURSES");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const course = await prisma.course.findUnique({ where: { id }, include: { modules: { orderBy: { displayOrder: "asc" }, include: { topics: { orderBy: { displayOrder: "asc" } } } } } });
  if (!course) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><p className="text-sm"><Link href="/admin/courses" className="font-semibold text-brand">Courses</Link></p><h1 className="font-display text-3xl font-bold">{course.name}</h1></div>
      <form action={saveCourse} className="grid gap-4 rounded-lg border bg-white p-5">
        <input type="hidden" name="id" value={course.id} />
        <label className="text-sm font-semibold">Name<Input className="mt-2 font-normal" name="name" defaultValue={course.name} /></label>
        <label className="text-sm font-semibold">Short description<Textarea className="mt-2 font-normal" name="shortDescription" defaultValue={course.shortDescription} /></label>
        <label className="text-sm font-semibold">Full description<Textarea className="mt-2 font-normal" name="fullDescription" defaultValue={course.fullDescription} /></label>
        <label className="text-sm font-semibold">Fee<Input className="mt-2 font-normal" name="fee" defaultValue={course.fee?.toString() || ""} placeholder="Leave blank to keep unpublished" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="feePublished" value="yes" defaultChecked={course.feePublished} /> Show fee on the website</label>
        <label className="text-sm font-semibold">Duration label<Input className="mt-2 font-normal" name="durationLabel" defaultValue={course.durationLabel} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="durationPublished" value="yes" defaultChecked={course.durationPublished} /> Show duration on the website</label>
        <label className="text-sm font-semibold">Publication<Select className="mt-2 font-normal" name="publicationStatus" defaultValue={course.publicationStatus}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="registrationOpen" value="yes" defaultChecked={course.registrationOpen} /> Registration open</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" value="yes" defaultChecked={course.featured} /> Featured</label>
        <div className="flex justify-end"><Button type="submit">Save course</Button></div>
      </form>
      {query.error ? <p className="rounded-lg border border-destructive/30 bg-white p-3 text-sm text-destructive" role="alert">{query.error}</p> : null}
      <section className="space-y-4 rounded-lg border bg-white p-5">
        <h2 className="font-semibold">Modules</h2>
        {course.modules.map((module, index) => (
          <div key={module.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{module.displayOrder}. {module.kind} · {module.title}</p>
              <div className="flex gap-2">
                <form action={moveModule}><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="id" value={module.id} /><input type="hidden" name="direction" value="up" /><Button type="submit" size="sm" variant="outline" disabled={index === 0}>Up</Button></form>
                <form action={moveModule}><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="id" value={module.id} /><input type="hidden" name="direction" value="down" /><Button type="submit" size="sm" variant="outline" disabled={index === course.modules.length - 1}>Down</Button></form>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {module.topics.map((topic) => (
                <li key={topic.id} className="flex items-center justify-between gap-3">
                  <span>{topic.displayOrder}. {topic.title}</span>
                  <form action={deleteTopic}><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="moduleId" value={module.id} /><input type="hidden" name="id" value={topic.id} /><Button type="submit" size="sm" variant="ghost">Remove</Button></form>
                </li>
              ))}
            </ul>
            <form action={addTopic} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="courseId" value={course.id} />
              <input type="hidden" name="moduleId" value={module.id} />
              <Input name="title" placeholder="New topic" aria-label={`Topic for ${module.title}`} className="max-w-sm" />
              <Button type="submit" size="sm" variant="outline">Add topic</Button>
            </form>
            <form action={deleteModule} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="courseId" value={course.id} />
              <input type="hidden" name="id" value={module.id} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" value="yes" /> Confirm delete</label>
              <Button type="submit" size="sm" variant="outline">Delete module</Button>
            </form>
          </div>
        ))}
        <form action={addModule} className="grid gap-3 border-t pt-4 md:grid-cols-2">
          <input type="hidden" name="courseId" value={course.id} />
          <Input name="kind" defaultValue="Module" aria-label="Module kind" />
          <Input name="title" placeholder="Module title" aria-label="Module title" required />
          <Textarea name="summary" placeholder="Optional summary" className="md:col-span-2" />
          <div><Button type="submit" variant="outline">Add module</Button></div>
        </form>
      </section>
    </div>
  );
}
