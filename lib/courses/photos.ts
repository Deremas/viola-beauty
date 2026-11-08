export const courseHeroPhoto = "/courses/hero.jpg";
export const courseStudioPhoto = "/courses/studio.jpg";

export const servicePhotos: Record<string, string> = {
  "nano-brows": "/courses/nano-brows.jpg",
  "ombre-brows": "/courses/ombre-brows.jpg",
  "combo-brows": "/courses/combo-brows.jpg",
  "lip-blushing": "/courses/lip-blushing.jpg",
  "lip-neutralization": "/courses/lip-neutralization.jpg",
  "permanent-eyeliner": "/courses/permanent-eyeliner.jpg",
  "eyebrow-lamination": "/courses/eyebrow-lamination.jpg",
  "eyebrow-henna": "/courses/eyebrow-henna.jpg",
  makeup: "/courses/makeup-artistry.jpg",
  "eyelash-extensions": "/courses/eyelash-extensions.jpg",
  nails: "/courses/nail-technology.jpg",
  waxing: "/courses/professional-waxing.jpg",
};

export function photoForService(slug: string) {
  return servicePhotos[slug] || courseStudioPhoto;
}

export const coursePhotos: Record<string, string> = {
  "nano-brows": "/courses/nano-brows.jpg",
  "ombre-brows": "/courses/ombre-brows.jpg",
  "combo-brows": "/courses/combo-brows.jpg",
  "lip-blushing": "/courses/lip-blushing.jpg",
  "lip-neutralization": "/courses/lip-neutralization.jpg",
  "permanent-eyeliner": "/courses/permanent-eyeliner.jpg",
  "eyebrow-lamination": "/courses/eyebrow-lamination.jpg",
  "eyebrow-henna": "/courses/eyebrow-henna.jpg",
  "makeup-artistry": "/courses/makeup-artistry.jpg",
  "eyelash-extensions": "/courses/eyelash-extensions.jpg",
  "nail-technology": "/courses/nail-technology.jpg",
  "professional-waxing": "/courses/professional-waxing.jpg",
};
