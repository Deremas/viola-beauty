import { courseCatalog, registrationInformation, type CatalogCourse } from "@/lib/courses/catalog";
import { serviceProfiles, type ServiceProfile } from "@/lib/courses/service-profiles";

const serviceDurations: Record<string, number> = {
  "nano-brows": 180,
  "ombre-brows": 150,
  "lip-blushing": 180,
  "eyebrow-lamination": 60,
};

export type ServiceFaq = { question: string; answer: string };

export type PublicService = {
  slug: string;
  code: string;
  name: string;
  category: string;
  summary: string;
  longDescription: string;
  benefits: string[];
  preparation: string[];
  aftercare: string[];
  faqs: ServiceFaq[];
  featured: boolean;
  displayOrder: number;
  group: ServiceProfile["group"];
  courseSlug: string;
  priceLabel: string | null;
  advanceLabel: string | null;
  durationMinutes: number | null;
  serviceId: string | null;
  imageId: string | null;
  bookable: boolean;
};

export type PublicCourse = {
  slug: string;
  code: string;
  name: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  skillLevel: string;
  prerequisites: string;
  objectives: string[];
  durationLabel: string | null;
  feeLabel: string | null;
  depositLabel: string | null;
  materials: string[];
  safety: string[];
  outcomes: string[];
  modules: Array<{ id: string; kind: string; title: string; summary: string | null; topics: Array<{ id: string; title: string; description: string | null }> }>;
  faqs: ServiceFaq[];
  featured: boolean;
  displayOrder: number;
  registrationOpen: boolean;
  registrationInfo: string;
  serviceSlug: string;
};

function serviceFromProfile(profile: ServiceProfile): PublicService {
  return {
    slug: profile.slug,
    code: profile.code,
    name: profile.name,
    category: profile.category,
    summary: profile.summary,
    longDescription: profile.longDescription,
    benefits: profile.benefits,
    preparation: profile.preparation,
    aftercare: profile.aftercare,
    faqs: profile.faqs,
    featured: profile.featured,
    displayOrder: profile.displayOrder,
    group: profile.group,
    courseSlug: profile.courseSlug,
    priceLabel: null,
    advanceLabel: null,
    durationMinutes: serviceDurations[profile.slug] ?? null,
    serviceId: profile.serviceId,
    imageId: null,
    bookable: false,
  };
}

export function loadPublicServices() {
  return serviceProfiles.map(serviceFromProfile).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
}

export function loadPublicService(slug: string) {
  return loadPublicServices().find((service) => service.slug === slug) || null;
}

function courseFromCatalog(course: CatalogCourse): PublicCourse {
  return {
    slug: course.slug,
    code: course.code,
    name: course.name,
    category: course.category,
    shortDescription: course.shortDescription,
    fullDescription: course.fullDescription,
    skillLevel: course.skillLevel,
    prerequisites: course.prerequisites,
    objectives: course.objectives,
    durationLabel: null,
    feeLabel: null,
    depositLabel: null,
    materials: course.materials,
    safety: course.safety,
    outcomes: course.outcomes,
    modules: [...course.theory, ...course.practical].map((module, moduleIndex) => ({
      id: `${course.slug}-${moduleIndex}`,
      kind: module.kind,
      title: module.title,
      summary: module.summary,
      topics: module.topics.map((topic, topicIndex) => ({
        id: `${course.slug}-${moduleIndex}-${topicIndex}`,
        title: topic.title,
        description: topic.description,
      })),
    })),
    faqs: course.faqs,
    featured: course.featured,
    displayOrder: course.displayOrder,
    registrationOpen: true,
    registrationInfo: registrationInformation,
    serviceSlug: course.serviceSlug,
  };
}

export function loadPublicCourses() {
  return courseCatalog.map(courseFromCatalog);
}

export function loadPublicCourse(slug: string) {
  return loadPublicCourses().find((course) => course.slug === slug) || null;
}
