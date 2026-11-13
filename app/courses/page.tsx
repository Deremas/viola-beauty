import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { BookOpen, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { defaultCourseFaqs } from "@/lib/brand";
import { loadPublicCourses } from "@/lib/courses/load";
import { CourseCatalog } from "@/components/courses/course-catalog";
import { Reveal } from "@/components/public/reveal";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { courseHeroPhoto } from "@/lib/courses/photos";

export const metadata = pageMetadata({
  title: "Beauty Courses",
  description: "Practical beauty courses at Viola Brows and Beauty in Addis Ababa, taught through hands-on training in the studio.",
  path: "/courses",
});

export default async function CoursesPage() {
  const courses = loadPublicCourses();
  const visibleFaqs = defaultCourseFaqs;

  return (
    <PublicShell>
      <main>
        <section className="bg-brand-plum text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 [&>*]:min-w-0">
            <div className="viola-rise min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-pink">Courses</p>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">Learn the craft. Practice it here.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">Practical courses in brows, lips, lashes, makeup, nails, and wax. Students learn the skills through hands-on training in the studio.</p>
              <Button asChild size="lg" className="mt-8 w-full bg-white text-brand-plum hover:bg-brand-soft sm:w-auto"><Link href="#register">Choose a course</Link></Button>
            </div>
            <img src={courseHeroPhoto} alt="Students practicing in the Viola studio" className="min-h-[360px] w-full rounded-[2rem] object-cover" />
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-4xl font-semibold text-brand-plum">What the courses cover</h2>
          <p className="mt-4 max-w-3xl leading-8 text-muted-foreground">Each course includes theory, practical topics, tools, and safety notes, so students can see what the training covers.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Reveal className="h-full"><Info icon={BookOpen} title="Theory and practice" text="Each course combines written topics with hands-on practice in the studio." /></Reveal>
            <Reveal delay={90} className="h-full"><Info icon={GraduationCap} title="Twelve courses" text="Brows, lips, eyes, makeup, lashes, nails, and wax each have their own course." /></Reveal>
            <Reveal delay={180} className="h-full"><Info icon={ShieldCheck} title="Hands-on training" text="Students learn the skill by practicing it in the studio." /></Reveal>
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
              <li>Training covers the same treatments offered to clients, from brows and lips to lashes, makeup, nails, and wax.</li>
              <li>Students develop practical beauty skills through hands-on training.</li>
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
