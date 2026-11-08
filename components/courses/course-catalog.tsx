"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Search, Signal } from "lucide-react";
import type { PublicCourse } from "@/lib/courses/load";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { coursePhotos } from "@/lib/courses/photos";
import { Reveal } from "@/components/public/reveal";

const levelLabel: Record<string, string> = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" };

export function CourseCatalog({ courses }: { courses: PublicCourse[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const categories = useMemo(() => Array.from(new Set(courses.map((course) => course.category))), [courses]);
  const visible = courses.filter((course) => {
    const haystack = `${course.name} ${course.shortDescription} ${course.category}`.toLowerCase();
    if (query && !haystack.includes(query.trim().toLowerCase())) return false;
    if (category && course.category !== category) return false;
    if (level && course.skillLevel !== level) return false;
    return true;
  });

  return (
    <div id="register">
      <div className="flex w-full flex-col gap-4 rounded-2xl border border-brand-line bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end lg:flex-nowrap">
        <label className="block w-full text-sm font-semibold sm:w-72 lg:w-auto lg:min-w-80 lg:flex-1">
          Search
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-brand-line bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 shrink-0 text-brand" />
            <input className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Course name" aria-label="Search courses" />
          </span>
        </label>
        <label className="block w-full text-sm font-semibold sm:w-48">Category<Select className="mt-2" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</Select></label>
        <label className="block w-full text-sm font-semibold sm:w-44">Skill level<Select className="mt-2" value={level} onChange={(event) => setLevel(event.target.value)} aria-label="Filter by skill level"><option value="">All levels</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></Select></label>
        <Button type="button" className="h-11 w-full shrink-0 self-end whitespace-nowrap sm:w-auto" onClick={() => { setQuery(""); setCategory(""); setLevel(""); }}>Clear Filters</Button>
      </div>
      {visible.length === 0 ? <p className="mt-8 rounded-2xl border border-dashed border-brand-line bg-white p-8 text-muted-foreground">No courses match those filters.</p> : null}
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((course, index) => (
          <Reveal key={course.slug} delay={(index % 3) * 90} className="h-full min-w-0">
          <article className="flex h-full flex-col rounded-2xl border border-brand-line bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-brand hover:shadow-soft focus-within:border-brand motion-reduce:transform-none">
            <div className="overflow-hidden rounded-xl bg-brand-plum">
              <img src={coursePhotos[course.slug] || "/courses/studio.jpg"} alt={`${course.name} at the Viola studio`} width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.04] motion-reduce:transform-none" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand">{course.category}</p>
            <h3 className="mt-2 font-display text-3xl font-semibold leading-none">{course.name}</h3>
            <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">{course.shortDescription}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-brand-plum">
              <span className="inline-flex items-center gap-1"><Signal className="h-4 w-4 text-brand" />{levelLabel[course.skillLevel] || course.skillLevel}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-brand" />{course.durationLabel || "Timetable on request"}</span>
            </div>
            {course.feeLabel ? <p className="mt-3 text-sm font-semibold">{course.feeLabel}</p> : <p className="mt-3 text-sm text-muted-foreground">Fee confirmed during registration</p>}
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button asChild variant="outline" className="h-11"><Link href={`/courses/${course.slug}`}>View Details</Link></Button>
              {course.registrationOpen ? <Button asChild className="h-11"><Link href={`/courses/${course.slug}/register`}>Register Now</Link></Button> : <Button type="button" disabled className="h-11">Registration closed</Button>}
            </div>
          </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
