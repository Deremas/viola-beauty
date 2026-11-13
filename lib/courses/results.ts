export type StudioResult = {
  serviceSlug: string;
  courseSlug: string;
  title: string;
  image: string;
  alt: string;
};

export const studioResults: StudioResult[] = [
  {
    serviceSlug: "ombre-brows",
    courseSlug: "ombre-brows",
    title: "Ombré Brows",
    image: "/results/ombre-brows.jpg",
    alt: "Ombré brows before and after at Viola Brows and Beauty",
  },
  {
    serviceSlug: "makeup",
    courseSlug: "makeup-artistry",
    title: "Makeup",
    image: "/results/makeup.jpg",
    alt: "Makeup before and after at Viola Brows and Beauty",
  },
  {
    serviceSlug: "eyebrow-lamination",
    courseSlug: "eyebrow-lamination",
    title: "Eyebrow Lamination",
    image: "/results/eyebrow-lamination.jpg",
    alt: "Eyebrow lamination before and after at Viola Brows and Beauty",
  },
  {
    serviceSlug: "eyelash-extensions",
    courseSlug: "eyelash-extensions",
    title: "Eyelash Extensions",
    image: "/results/eyelash-extensions.jpg",
    alt: "Eyelash extensions before and after at Viola Brows and Beauty",
  },
  {
    serviceSlug: "combo-brows",
    courseSlug: "combo-brows",
    title: "Combo Brows",
    image: "/results/combo-brows.jpg",
    alt: "Combo brows before and after at Viola Brows and Beauty",
  },
];

export function resultForService(slug: string) {
  return studioResults.find((item) => item.serviceSlug === slug) || null;
}

export function resultForCourse(slug: string) {
  return studioResults.find((item) => item.courseSlug === slug) || null;
}
