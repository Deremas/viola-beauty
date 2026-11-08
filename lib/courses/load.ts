import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { courseCatalog, registrationInformation, type CatalogCourse } from "@/lib/courses/catalog";
import { serviceProfiles, type ServiceProfile } from "@/lib/courses/service-profiles";
import { readIfReady } from "@/lib/courses/db";
import { decimalToCents } from "@/lib/courses/money";

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

type DbService = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: { toString(): string };
  advanceAmount: { toString(): string };
  durationMinutes: number;
  isActive: boolean;
  image: { id: string } | null;
};

function lines(value: string | null | undefined) {
  return (value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function faqsFromJson(value: unknown): ServiceFaq[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as { question?: unknown; answer?: unknown };
    const question = typeof record.question === "string" ? record.question.trim() : "";
    const answer = typeof record.answer === "string" ? record.answer.trim() : "";
    return question && answer ? [{ question, answer }] : [];
  });
}

function normalizeServiceName(value: string) {
  return value.toLowerCase().replace(/é/g, "e").replace(/[^a-z0-9]/g, "");
}

function priceLabel(service: DbService | undefined) {
  if (!service?.isActive) return null;
  const cents = decimalToCents(service.price);
  if (cents == null || cents <= 0) return null;
  return money(cents / 100);
}

export async function loadPublicServices() {
  const [services, contents] = await Promise.all([
    readIfReady(() => prisma.service.findMany({
      where: { deletedAt: null },
      include: { image: { select: { id: true } } },
      orderBy: { name: "asc" },
    }), []),
    readIfReady(() => prisma.serviceContent.findMany(), []),
  ]);
  const contentBySlug = new Map(contents.map((content) => [content.slug, content]));
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const cards: PublicService[] = serviceProfiles.flatMap((profile) => {
    const content = contentBySlug.get(profile.slug);
    if (content && content.publicationStatus !== "PUBLISHED") return [];
    const named = services.find((item) => normalizeServiceName(item.name) === normalizeServiceName(profile.name));
    const service = (content?.serviceId ? serviceById.get(content.serviceId) : undefined) || (profile.serviceId ? serviceById.get(profile.serviceId) : undefined) || named;
    const bookable = Boolean(service?.isActive && (decimalToCents(service.price) || 0) > 0);
    return [{
      slug: content?.slug || profile.slug,
      code: content?.code || profile.code,
      name: content?.headline || profile.name,
      category: content?.category || profile.category,
      summary: content?.summary || profile.summary,
      longDescription: content?.longDescription || profile.longDescription,
      benefits: content ? lines(content.benefits) : profile.benefits,
      preparation: content ? lines(content.preparation) : profile.preparation,
      aftercare: content ? lines(content.aftercare) : profile.aftercare,
      faqs: content ? faqsFromJson(content.faqs) : profile.faqs,
      featured: content?.featured ?? profile.featured,
      displayOrder: content?.displayOrder ?? profile.displayOrder,
      group: profile.group,
      courseSlug: profile.courseSlug,
      priceLabel: priceLabel(service),
      advanceLabel: bookable && service ? money(service.advanceAmount) : null,
      durationMinutes: bookable && service ? service.durationMinutes : null,
      serviceId: service ? service.id : null,
      imageId: service?.image ? service.id : null,
      bookable,
    }];
  });

  return cards.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
}

export async function loadPublicService(slug: string) {
  const services = await loadPublicServices();
  return services.find((service) => service.slug === slug) || null;
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

function courseFromRow(course: {
  slug: string;
  code: string;
  name: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  skillLevel: string;
  prerequisites: string | null;
  learningObjectives: string | null;
  durationLabel: string;
  durationPublished: boolean;
  fee: { toString(): string } | null;
  feePublished: boolean;
  deposit: { toString(): string } | null;
  includedMaterials: string | null;
  safetyNotes: string | null;
  toolsAndMaterials: string | null;
  registrationInfo: string | null;
  faqs: unknown;
  featured: boolean;
  displayOrder: number;
  registrationOpen: boolean;
  modules: Array<{ id: string; kind: string; title: string; summary: string | null; displayOrder: number; topics: Array<{ id: string; title: string; description: string | null; displayOrder: number }> }>;
}, catalog: CatalogCourse | undefined): PublicCourse {
  const feeCents = course.feePublished ? decimalToCents(course.fee) : null;
  const depositCents = course.feePublished ? decimalToCents(course.deposit) : null;
  return {
    slug: course.slug,
    code: course.code,
    name: course.name,
    category: course.category,
    shortDescription: course.shortDescription,
    fullDescription: course.fullDescription,
    skillLevel: course.skillLevel,
    prerequisites: course.prerequisites || catalog?.prerequisites || "",
    objectives: lines(course.learningObjectives).length ? lines(course.learningObjectives) : catalog?.objectives || [],
    durationLabel: course.durationPublished ? course.durationLabel : null,
    feeLabel: feeCents != null && feeCents > 0 ? money(feeCents / 100) : null,
    depositLabel: depositCents != null && depositCents > 0 ? money(depositCents / 100) : null,
    materials: lines(course.includedMaterials || course.toolsAndMaterials),
    safety: lines(course.safetyNotes),
    outcomes: catalog?.outcomes || [],
    modules: course.modules
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((module) => ({
        id: module.id,
        kind: module.kind,
        title: module.title,
        summary: module.summary,
        topics: module.topics.slice().sort((a, b) => a.displayOrder - b.displayOrder).map((topic) => ({
          id: topic.id,
          title: topic.title,
          description: topic.description,
        })),
      })),
    faqs: faqsFromJson(course.faqs),
    featured: course.featured,
    displayOrder: course.displayOrder,
    registrationOpen: course.registrationOpen,
    registrationInfo: course.registrationInfo || registrationInformation,
    serviceSlug: catalog?.serviceSlug || course.slug,
  };
}

export async function loadPublicCourses() {
  const rows = await readIfReady(
    () => prisma.course.findMany({
      where: { publicationStatus: "PUBLISHED" },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: { modules: { include: { topics: true } } },
    }),
    [],
  );
  const total = await readIfReady(() => prisma.course.count(), 0);
  if (total === 0) return courseCatalog.map(courseFromCatalog);
  const catalogBySlug = new Map(courseCatalog.map((course) => [course.slug, course]));
  return rows.map((course) => courseFromRow(course, catalogBySlug.get(course.slug)));
}

export async function loadPublicCourse(slug: string) {
  const courses = await loadPublicCourses();
  return courses.find((course) => course.slug === slug) || null;
}
