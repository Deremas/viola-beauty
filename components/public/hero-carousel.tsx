"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { courseHeroPhoto, courseStudioPhoto } from "@/lib/courses/photos";
import { Button } from "@/components/ui/button";

type Slide = {
  key: string;
  kicker: string;
  title: string;
  text: string;
  image: string;
  alt: string;
  position: string;
  actions: { href: string; label: string; tone: "solid" | "ghost"; icon?: "arrow" }[];
};

export function HeroCarousel({ title, text }: { title: string; text: string }) {
  const slides: Slide[] = [
    {
      key: "studio",
      kicker: "Viola Brows and Beauty",
      title,
      text,
      image: courseStudioPhoto,
      alt: "Neon Viola Brows and Beauty sign in the studio",
      position: "object-[72%_center]",
      actions: [
        { href: "/book", label: "Book a Service", tone: "solid", icon: "arrow" },
        { href: "/courses", label: "Explore Courses", tone: "ghost" },
      ],
    },
    {
      key: "courses",
      kicker: "Courses",
      title: "Learn the craft in the studio.",
      text: "Practical beauty courses for brows, lips, lashes, makeup, nails, and wax, taught through hands-on training in the studio.",
      image: courseHeroPhoto,
      alt: "Students practicing in the Viola classroom",
      position: "object-center",
      actions: [{ href: "/courses", label: "Explore Courses", tone: "solid", icon: "arrow" }],
    },
    {
      key: "services",
      kicker: "Services",
      title: "Beauty treatments in the studio.",
      text: "Brows, lips, lashes, makeup, nails, and wax, offered with care and attention to detail.",
      image: "/courses/services-hero.jpg",
      alt: "Treatment beds in the Viola studio",
      position: "object-[68%_center]",
      actions: [
        { href: "/book", label: "Book a Service", tone: "solid", icon: "arrow" },
        { href: "/services", label: "View services", tone: "ghost" },
      ],
    },
  ];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  function go(step: number) {
    setIndex((current) => (current + step + slides.length) % slides.length);
  }

  return (
    <section
      className="relative h-[42rem] overflow-hidden bg-brand-plum text-white sm:h-[46rem] lg:h-[78vh] lg:min-h-[40rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div
        className="absolute inset-0"
        role="region"
        aria-roledescription="carousel"
        aria-label="Studio, courses, and services"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            go(1);
          }
        }}
      >
        {slides.map((slide, slideIndex) => {
          const active = slideIndex === index;
          return (
            <article
              key={slide.key}
              id={`hero-slide-${slide.key}`}
              aria-hidden={!active}
              inert={!active}
              className="absolute inset-0 transition-transform duration-700 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(${(slideIndex - index) * 100}%)` }}
            >
              <img src={slide.image} alt={slide.alt} width={1400} height={900} decoding="async" className={`absolute inset-0 h-full w-full object-cover ${slide.position}`} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(36,20,37,0.9) 0%, rgba(36,20,37,0.72) 38%, rgba(36,20,37,0.28) 68%, rgba(36,20,37,0.12) 100%)" }} />
              <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 pb-24 sm:px-6">
                <div className="max-w-xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-pink">{slide.kicker}</p>
                  {slideIndex === 0 ? (
                    <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] sm:text-7xl">{slide.title}</h1>
                  ) : (
                    <p className="mt-4 font-display text-5xl font-semibold leading-[0.95] sm:text-7xl">{slide.title}</p>
                  )}
                  <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">{slide.text}</p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {slide.actions.map((action) => (
                      <Button
                        key={action.href + action.label}
                        asChild
                        size="lg"
                        variant={action.tone === "solid" ? "default" : "outline"}
                        className={
                          action.tone === "solid"
                            ? "w-full bg-white text-brand-plum hover:bg-brand-soft sm:w-auto"
                            : "w-full border-white/40 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                        }
                      >
                        <Link href={action.href} tabIndex={active ? 0 : -1}>
                          {action.label}
                          {action.icon === "arrow" ? <ArrowRight className="h-4 w-4" /> : null}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-6 sm:px-6">
          <div className="flex shrink-0 gap-2">
            <button type="button" aria-label="Previous card" onClick={() => go(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm hover:bg-white/15">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Next card" onClick={() => go(1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm hover:bg-white/15">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
