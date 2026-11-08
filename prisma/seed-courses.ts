import { PrismaClient } from "@prisma/client";
import { brand, defaultCourseFaqs } from "../lib/brand";
import { courseCatalog, registrationInformation } from "../lib/courses/catalog";
import { courseRolePresets } from "../lib/courses/roles";
import { serviceProfiles } from "../lib/courses/service-profiles";

export async function seedCourseCatalog(client: PrismaClient) {
  await ensureBookingServices(client);
  const services = await client.service.findMany({ where: { deletedAt: null }, select: { id: true } });
  const serviceIds = new Set(services.map((service) => service.id));

  for (const profile of serviceProfiles) {
    const existing = await client.serviceContent.findUnique({ where: { slug: profile.slug }, select: { id: true, serviceId: true, publicationStatus: true } });
    if (existing) {
      const serviceId = profile.serviceId && serviceIds.has(profile.serviceId) ? profile.serviceId : null;
      if (serviceId && !existing.serviceId) {
        await client.serviceContent.update({ where: { id: existing.id }, data: { serviceId } });
      }
      if (existing.publicationStatus === "DRAFT") {
        await client.serviceContent.update({ where: { id: existing.id }, data: { publicationStatus: "PUBLISHED" } });
      }
      continue;
    }
    await client.serviceContent.create({
      data: {
        slug: profile.slug,
        serviceId: profile.serviceId && serviceIds.has(profile.serviceId) ? profile.serviceId : null,
        code: profile.code,
        headline: profile.name,
        category: profile.category,
        summary: profile.summary,
        longDescription: profile.longDescription,
        benefits: profile.benefits.join("\n"),
        preparation: profile.preparation.join("\n"),
        aftercare: profile.aftercare.join("\n"),
        faqs: profile.faqs,
        featured: profile.featured,
        displayOrder: profile.displayOrder,
        publicationStatus: "PUBLISHED",
      },
    });
  }

  for (const course of courseCatalog) {
    const existing = await client.course.findUnique({ where: { id: course.id }, select: { id: true, modules: { select: { id: true } } } });
    if (!existing) {
      await client.course.create({
        data: {
          id: course.id,
          code: course.code,
          name: course.name,
          slug: course.slug,
          category: course.category,
          shortDescription: course.shortDescription,
          fullDescription: course.fullDescription,
          skillLevel: course.skillLevel,
          prerequisites: course.prerequisites,
          learningObjectives: course.objectives.join("\n"),
          durationLabel: course.durationLabel,
          durationPublished: false,
          includedMaterials: course.materials.join("\n"),
          safetyNotes: course.safety.join("\n"),
          toolsAndMaterials: course.materials.join("\n"),
          additionalNotes: "Draft syllabus. Fees and dates stay unpublished until Viola approves them.",
          registrationInfo: registrationInformation,
          faqs: course.faqs,
          registrationOpen: true,
          featured: course.featured,
          publicationStatus: "PUBLISHED",
          displayOrder: course.displayOrder,
          modules: {
            create: [...course.theory, ...course.practical].map((module, moduleIndex) => ({
              kind: module.kind,
              title: module.title,
              summary: module.summary,
              displayOrder: moduleIndex + 1,
              topics: { create: module.topics.map((topic, topicIndex) => ({ title: topic.title, description: topic.description, displayOrder: topicIndex + 1 })) },
            })),
          },
        },
      });
    }
  }

  const catalogIds = courseCatalog.map((course) => course.id);
  await client.course.updateMany({
    where: { id: { in: catalogIds }, publicationStatus: "DRAFT" },
    data: { publicationStatus: "PUBLISHED", registrationOpen: true },
  });
  await client.course.updateMany({
    where: { id: { in: catalogIds }, publicationStatus: "PUBLISHED", registrationOpen: false },
    data: { registrationOpen: true },
  });

  const faqCount = await client.websiteFaq.count({ where: { scope: "courses" } });
  if (faqCount === 0) {
    await client.websiteFaq.createMany({
      data: defaultCourseFaqs.map((faq, index) => ({ scope: "courses", question: faq.question, answer: faq.answer, displayOrder: index + 1, publicationStatus: "PUBLISHED" as const })),
    });
  }

  await client.siteSetting.upsert({
    where: { id: "primary" },
    update: {},
    create: {
      id: "primary",
      heroTitle: brand.heroTitle,
      heroText: brand.heroText,
      aboutTitle: brand.aboutTitle,
      aboutText: brand.aboutText,
      addressLine: brand.addressLine,
      city: brand.city,
      phonePrimary: brand.phonePrimary,
      phoneSecondary: brand.phoneSecondary,
      instagramUrl: brand.instagram,
      facebookUrl: brand.facebook,
      tiktokUrl: brand.tiktok,
      mapUrl: brand.mapUrl,
      footerText: brand.footerText,
      emailVerified: false,
    },
  });

  for (const role of courseRolePresets) {
    const existing = await client.staffRole.findUnique({ where: { name: role.name }, select: { id: true } });
    if (existing) continue;
    await client.staffRole.create({
      data: {
        name: role.name,
        description: role.description,
        isSystem: true,
        permissions: { create: role.permissions.map((permission) => ({ permission })) },
      },
    });
  }
}

async function ensureBookingServices(client: PrismaClient) {
  for (const profile of serviceProfiles) {
    if (!profile.serviceId) continue;
    const existing = await client.service.findFirst({
      where: { deletedAt: null, OR: [{ id: profile.serviceId }, { name: profile.name }] },
      select: { id: true },
    });
    if (existing) continue;
    await client.service.create({
      data: {
        id: profile.serviceId,
        name: profile.name,
        category: profile.category,
        description: profile.summary,
        price: 0,
        advanceAmount: 0,
        durationMinutes: 60,
        bufferMinutes: 10,
        isActive: true,
      },
    });
  }
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("prisma/seed-courses.ts")) {
  const prisma = new PrismaClient();
  seedCourseCatalog(prisma)
    .then(async () => prisma.$disconnect())
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
