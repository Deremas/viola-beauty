import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { loadPublicCourse, loadPublicCourses } from "@/lib/courses/load";
import { RegistrationForm } from "@/components/courses/registration-form";
import { PublicShell } from "@/components/public/public-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const course = await loadPublicCourse((await params).slug);
  if (!course) return pageMetadata({ title: "Student Registration", description: "Send a course registration request to Viola Brows and Beauty.", path: "/courses", index: false });
  return pageMetadata({
    title: `Register for ${course.name}`,
    description: `Send a registration request for ${course.name} at Viola Brows and Beauty in Addis Ababa. This form does not take payment and does not confirm a seat, fee, or start date.`,
    path: `/courses/${course.slug}/register`,
  });
}

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const course = await loadPublicCourse((await params).slug);
  if (!course || !course.registrationOpen) notFound();
  const courses = (await loadPublicCourses())
    .filter((item) => item.registrationOpen)
    .map((item) => ({ slug: item.slug, name: item.name }));
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Student registration</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-brand-plum">Request a place on {course.name}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">This form does not take payment and does not confirm enrollment.</p>
        <div className="mt-8"><RegistrationForm slug={course.slug} courseName={course.name} courses={courses} /></div>
      </main>
    </PublicShell>
  );
}
