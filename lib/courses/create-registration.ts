import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { securityHash } from "@/lib/security";
import { appDate, localDateTimeToUtc } from "@/lib/timezone";
import { decimalToCents, centsToDecimalString } from "@/lib/courses/money";
import { cleanLine, cleanMultiline, intakeKey, WorkflowError } from "@/lib/courses/transitions";

export class RegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrationError";
  }
}

export async function createCourseRegistration(input: {
  slug: string;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  experience?: string;
  intakeName?: string;
  expectedStartDate?: string;
  notes?: string;
  consent: boolean;
  idempotencyKey: string;
  source?: "WEBSITE" | "ADMIN" | "RECEPTION";
  actorId?: string;
}) {
  const fullName = cleanLine(input.fullName, 120);
  const phone = normalizeEthiopianPhone(input.phone);
  const email = cleanLine(input.email || "", 160).toLowerCase();
  const city = cleanLine(input.city || "", 160);
  const experience = cleanMultiline(input.experience || "", 2000);
  const intakeName = cleanLine(input.intakeName || "", 80);
  const notes = cleanMultiline(input.notes || "", 2000);
  if (fullName.length < 2) throw new RegistrationError("Enter the student's full name.");
  if (!phone) throw new RegistrationError("Enter a valid Ethiopian mobile number.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new RegistrationError("Enter a valid email or leave it blank.");
  if (!input.consent) throw new RegistrationError("Consent is required before the request can be sent.");
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(input.idempotencyKey)) throw new RegistrationError("Refresh the form and submit it again.");

  let expectedStart: Date | null = null;
  if (input.expectedStartDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expectedStartDate)) throw new RegistrationError("Enter a valid expected start date.");
    expectedStart = localDateTimeToUtc(input.expectedStartDate, "09:00");
    const today = localDateTimeToUtc(appDate(new Date()), "00:00");
    if (expectedStart.getTime() < today.getTime()) throw new RegistrationError("The expected start date cannot be in the past.");
  }

  const existingToken = await prisma.courseRegistration.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { registrationNumber: true } });
  if (existingToken) return { registrationNumber: existingToken.registrationNumber, token: input.idempotencyKey, alreadySubmitted: true };

  try {
    return await prisma.$transaction(async (tx) => {
      const course = await tx.course.findFirst({ where: { slug: input.slug, publicationStatus: "PUBLISHED", registrationOpen: true } });
      if (!course) throw new RegistrationError("This course is not open for registration.");
      const key = intakeKey(intakeName);
      let student = await tx.student.findUnique({ where: { phone } });
      if (!student) {
        student = await tx.student.create({ data: { fullName, phone, email: email || null, city: city || null, experience: experience || null } });
      } else {
        student = await tx.student.update({
          where: { id: student.id },
          data: {
            email: student.email || email || undefined,
            city: student.city || city || undefined,
            experience: student.experience || experience || undefined,
          },
        });
      }
      const duplicate = await tx.courseRegistration.findFirst({ where: { studentId: student.id, courseId: course.id, intakeKey: key, activeKey: "open" } });
      if (duplicate) throw new RegistrationError(`An active registration already exists for this course: ${duplicate.registrationNumber}.`);

      const year = new Date().getFullYear();
      const counter = await tx.registrationCounter.upsert({ where: { year }, create: { year, last: 1 }, update: { last: { increment: 1 } } });
      const registrationNumber = `VR-${year}-${String(counter.last).padStart(5, "0")}`;
      const feeCents = course.feePublished ? decimalToCents(course.fee) : null;
      const depositCents = course.feePublished ? decimalToCents(course.deposit) : null;
      const registration = await tx.courseRegistration.create({
        data: {
          registrationNumber,
          studentId: student.id,
          courseId: course.id,
          intakeName: intakeName || null,
          intakeKey: key,
          expectedStartDate: expectedStart,
          source: input.source || "WEBSITE",
          agreedFee: feeCents != null ? centsToDecimalString(feeCents) : null,
          requiredDeposit: depositCents != null ? centsToDecimalString(depositCents) : null,
          submittedName: fullName,
          addressSnapshot: city || null,
          experienceSnapshot: experience || null,
          notes: notes || null,
          consentAcceptedAt: new Date(),
          idempotencyKey: input.idempotencyKey,
          accessTokenHash: securityHash(input.idempotencyKey),
          createdById: input.actorId,
          updatedById: input.actorId,
          events: { create: { action: "Registration created", newValue: "PENDING", actorId: input.actorId, reason: "Registration request received" } },
        },
      });
      await tx.auditLog.create({
        data: { actorId: input.actorId, action: "registration.create", entityType: "CourseRegistration", entityId: registration.id, summary: `${registrationNumber} created for ${course.name}` },
      });
      return { registrationNumber, token: input.idempotencyKey, alreadySubmitted: false };
    });
  } catch (error) {
    if (error instanceof RegistrationError || error instanceof WorkflowError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const replay = await prisma.courseRegistration.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { registrationNumber: true } });
      if (replay) return { registrationNumber: replay.registrationNumber, token: input.idempotencyKey, alreadySubmitted: true };
      throw new RegistrationError("An active registration already exists for this student, course, and intake.");
    }
    throw error;
  }
}
