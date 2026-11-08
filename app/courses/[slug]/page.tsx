import { breadcrumbJsonLd, faqJsonLd, pageMetadata, siteName } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublicCourse, loadPublicCourses } from "@/lib/courses/load";
import { coursePhotos } from "@/lib/courses/photos";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const course = await loadPublicCourse((await params).slug);
  if (!course) return pageMetadata({ title: "Course", description: "A practical beauty course at Viola Brows and Beauty.", path: "/courses" });
  return pageMetadata({
    title: /course/i.test(course.name) ? course.name : `${course.name} Course`,
    description: course.shortDescription,
    path: `/courses/${course.slug}`,
  });
}

const levelLabel: Record<string, string> = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" };

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, courses] = await Promise.all([loadPublicCourse(slug), loadPublicCourses()]);
  if (!course) notFound();
  const related = courses.filter((item) => item.category === course.category && item.slug !== course.slug).slice(0, 3);
  const faqData = faqJsonLd(course.faqs);

  return (
    <PublicShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
        { name: siteName, path: "/" },
        { name: "Beauty Courses", path: "/courses" },
        { name: course.name, path: `/courses/${course.slug}` },
      ])) }} />
      {faqData ? <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} /> : null}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">{course.category}</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] [&>*]:min-w-0">
          <article>
            <h1 className="font-display text-5xl font-semibold text-brand-plum">{course.name}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{course.shortDescription}</p>
            <Reveal><img src={coursePhotos[course.slug] || "/courses/studio.jpg"} alt={`${course.name} at the Viola studio`} width={800} height={450} loading="lazy" decoding="async" className="mt-6 h-52 w-full max-w-2xl rounded-2xl object-cover sm:h-64" /></Reveal>
            <p className="mt-6 max-w-3xl leading-8 text-muted-foreground">{course.fullDescription}</p>
            <dl className="mt-8 grid gap-3 sm:grid-cols-3">
              <Meta label="Level" value={levelLabel[course.skillLevel] || course.skillLevel} />
              <Meta label="Duration" value={course.durationLabel || "Shared at registration"} />
              <Meta label="Fee" value={course.feeLabel || "Not published"} />
            </dl>
            <Section title="Prerequisites"><p>{course.prerequisites}</p></Section>
            <Section title="Learning outcomes"><ul className="list-disc space-y-2 pl-5">{course.objectives.map((item) => <li key={item}>{item}</li>)}</ul></Section>
            <Section title="Curriculum">
              <div className="space-y-3">
                {course.modules.map((module, index) => (
                  <details key={module.id} open={index === 0} className="rounded-2xl border border-brand-line bg-white p-4">
                    <summary className="cursor-pointer font-semibold">{module.kind === "PRACTICAL" ? "Practical" : "Theory"} · {module.title}</summary>
                    {module.summary ? <p className="mt-3 text-sm text-muted-foreground">{module.summary}</p> : null}
                    <ul className="mt-3 space-y-3">
                      {module.topics.map((topic) => <li key={topic.id}><p className="font-medium">{topic.title}</p>{topic.description ? <p className="text-sm leading-6 text-muted-foreground">{topic.description}</p> : null}</li>)}
                    </ul>
                  </details>
                ))}
              </div>
            </Section>
            {course.materials.length > 0 ? <Section title="Tools and materials"><ul className="list-disc space-y-2 pl-5">{course.materials.map((item) => <li key={item}>{item}</li>)}</ul></Section> : null}
            {course.safety.length > 0 ? <Section title="Safety"><ul className="list-disc space-y-2 pl-5">{course.safety.map((item) => <li key={item}>{item}</li>)}</ul></Section> : null}
            {course.faqs.length > 0 ? <Section title="Questions">{course.faqs.map((faq) => <details key={faq.question} className="mb-3 rounded-xl border p-4"><summary className="cursor-pointer font-semibold">{faq.question}</summary><p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p></details>)}</Section> : null}
            {related.length > 0 ? <Section title="Related courses"><div className="grid gap-3 sm:grid-cols-3">{related.map((item) => <Link key={item.slug} href={`/courses/${item.slug}`} className="rounded-xl border p-4 font-semibold hover:border-brand">{item.name}</Link>)}</div></Section> : null}
          </article>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-brand-line bg-white p-6">
              <h2 className="font-display text-3xl font-semibold">Registration</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{course.registrationInfo}</p>
              {course.depositLabel ? <p className="mt-4 text-sm">Deposit, if published: <strong>{course.depositLabel}</strong></p> : null}
              <div className="mt-6">
                {course.registrationOpen ? <Button asChild className="w-full"><Link href={`/courses/${course.slug}/register`}>Register Now</Link></Button> : <p className="text-sm font-semibold">Registration is closed for this course.</p>}
              </div>
              <Button asChild variant="outline" className="mt-3 w-full"><Link href={`/services/${course.serviceSlug}`}>View the matching service</Link></Button>
            </div>
          </aside>
        </div>
      </main>
    </PublicShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-brand-mist p-4"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Reveal><section className="mt-10"><h2 className="font-display text-3xl font-semibold text-brand-plum">{title}</h2><div className="mt-4 leading-7 text-brand-plum/80">{children}</div></section></Reveal>;
}
