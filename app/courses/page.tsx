import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { BookOpen, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { defaultCourseFaqs } from "@/lib/brand";
import { loadPublicCourses } from "@/lib/courses/load";
import { CourseCatalog } from "@/components/courses/course-catalog";
import { Reveal } from "@/components/public/reveal";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { readIfReady } from "@/lib/courses/db";
import { courseHeroPhoto } from "@/lib/courses/photos";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Beauty Courses",
  description: "Practical beauty courses at Viola Brows and Beauty in Addis Ababa. Read a course and send a registration request. A request is not a confirmed seat, fee, or start date.",
  path: "/courses",
});

export default async function CoursesPage() {
  const courses = await loadPublicCourses();
  const faqs = await readIfReady(
    () => prisma.websiteFaq.findMany({ where: { scope: "courses", publicationStatus: "PUBLISHED" }, orderBy: { displayOrder: "asc" } }),
    [],
  );
  const visibleFaqs = faqs.length > 0 ? faqs.map((faq) => ({ question: faq.question, answer: faq.answer })) : defaultCourseFaqs;

  return (
    <PublicShell>
      <main>
        <section className="bg-brand-plum text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 [&>*]:min-w-0">
            <div className="viola-rise min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-pink">Courses</p>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">Learn the craft. Practice it here.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">Viola Brows and Beauty teaches practical beauty courses in Addis Ababa. A registration request is not a confirmed seat, fee, or start date.</p>
              <Button asChild size="lg" className="mt-8 w-full bg-white text-brand-plum hover:bg-brand-soft sm:w-auto"><Link href="#register">Choose a course</Link></Button>
            </div>
            <img src={courseHeroPhoto} alt="Students practicing in the Viola studio" className="min-h-[360px] w-full rounded-[2rem] object-cover" />
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-4xl font-semibold text-brand-plum">What the courses cover</h2>
          <p className="mt-4 max-w-3xl leading-8 text-muted-foreground">Each course has an introduction, objectives, theory topics, practical topics, tools, and safety notes. Viola can edit the syllabus. Prices and dates stay hidden until the studio publishes them.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Reveal className="h-full"><Info icon={BookOpen} title="Theory and practice" text="Modules open on the course page so you can read the topics before you register." /></Reveal>
            <Reveal delay={90} className="h-full"><Info icon={GraduationCap} title="Twelve courses" text="Brows, lips, eyes, makeup, lashes, nails, and waxing each have their own course." /></Reveal>
            <Reveal delay={180} className="h-full"><Info icon={ShieldCheck} title="Reviewed registration" text="Staff approve the request, record payment, and later mark the class started or finished." /></Reveal>
          </div>
        </section>
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-4xl font-semibold text-brand-plum">All courses</h2>
            <div className="mt-8"><CourseCatalog courses={courses} /></div>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 [&>*]:min-w-0">
          <div>
            <h2 className="font-display text-4xl font-semibold text-brand-plum">Why learn with Viola</h2>
            <ul className="mt-6 space-y-3 text-muted-foreground">
              <li>Courses are taught as studio practice, with the method written in modules.</li>
              <li>Service booking stays separate, so a class request does not take an appointment slot.</li>
              <li>No graduate counts, accreditation, or instructor claims are published here.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-4xl font-semibold text-brand-plum">Questions</h2>
            <div className="mt-6 space-y-3">
              {visibleFaqs.map((faq) => (
                <details key={faq.question} className="viola-card rounded-2xl border border-brand-line bg-white p-4">
                  <summary className="cursor-pointer font-semibold">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

function Info({ icon: Icon, title, text }: { icon: typeof Sparkles; title: string; text: string }) {
  return <article className="viola-card h-full rounded-2xl border border-brand-line bg-white p-5"><Icon className="h-6 w-6 text-brand" /><h3 className="mt-4 text-xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>;
}
