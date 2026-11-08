"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PermissionKey, RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasPermission, requirePermission } from "@/lib/permissions";
import { saveManagedUpload } from "@/lib/upload";
import { appDate, localDateTimeToUtc } from "@/lib/timezone";
import { applyOverdue, centsToDecimalString, decimalToCents, isCourseOverdue, netCents, parseMoneyToCents, summarizeLedger } from "@/lib/courses/money";
import { assertClassTransition, assertRegistrationTransition, canBulkStart, closesRegistration, intakeKey, WorkflowError } from "@/lib/courses/transitions";
import { createCourseRegistration, RegistrationError } from "@/lib/courses/create-registration";

function back(id: string, message?: string): never {
  const query = message ? `?error=${encodeURIComponent(message)}` : "";
  redirect(`/admin/registrations/${id}${query}`);
}

async function refreshStanding(registrationId: string) {
  const registration = await prisma.courseRegistration.findUnique({
    where: { id: registrationId },
    include: { payments: true },
  });
  if (!registration) return;
  const net = netCents(decimalToCents(registration.agreedFee), decimalToCents(registration.approvedDiscount) || 0);
  const summary = summarizeLedger(registration.payments.map((payment) => ({
    amountCents: decimalToCents(payment.amount) || 0,
    type: payment.ledgerType,
    status: payment.verificationStatus,
  })), net);
  const standing = applyOverdue(summary.standing, isCourseOverdue({
    expectedStartDate: registration.expectedStartDate,
    registrationStatus: registration.registrationStatus,
    outstandingCents: summary.outstandingCents,
  }));
  await prisma.courseRegistration.update({ where: { id: registrationId }, data: { paymentStanding: standing } });
}

const statusPermission: Record<string, PermissionKey> = {
  APPROVED: "APPROVE_REGISTRATIONS",
  REJECTED: "REJECT_REGISTRATIONS",
  CONFIRMED: "CONFIRM_REGISTRATIONS",
  CANCELLED: "CANCEL_REGISTRATIONS",
  WITHDRAWN: "WITHDRAW_REGISTRATIONS",
};

export async function updateRegistrationStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const next = String(formData.get("status") || "");
  const reason = String(formData.get("reason") || "").trim();
  const permission = statusPermission[next];
  if (!permission) back(id, "That status is not available.");
  const user = await requirePermission(permission);
  const registration = await prisma.courseRegistration.findUnique({ where: { id } });
  if (!registration) back(id, "Registration not found.");
  try {
    assertRegistrationTransition(registration.registrationStatus, next);
  } catch (error) {
    back(id, error instanceof WorkflowError ? error.message : "The status could not be changed.");
  }
  if ((next === "REJECTED" || next === "CANCELLED" || next === "WITHDRAWN") && reason.length < 3) back(id, "Add a short reason.");
  await prisma.$transaction([
    prisma.courseRegistration.update({
      where: { id },
      data: {
        registrationStatus: next as RegistrationStatus,
        activeKey: closesRegistration(next) ? id : "open",
        approvedAt: next === "APPROVED" ? new Date() : undefined,
        confirmedAt: next === "CONFIRMED" ? new Date() : undefined,
        updatedById: user.id,
      },
    }),
    prisma.registrationEvent.create({ data: { registrationId: id, action: `Registration ${next.toLowerCase()}`, previousValue: registration.registrationStatus, newValue: next, reason: reason || null, actorId: user.id } }),
    prisma.auditLog.create({ data: { actorId: user.id, action: "registration.status", entityType: "CourseRegistration", entityId: id, summary: `${registration.registrationNumber} ${registration.registrationStatus} to ${next}` } }),
  ]);
  revalidatePath(`/admin/registrations/${id}`);
  back(id);
}

export async function updateRegistrationFee(formData: FormData) {
  const id = String(formData.get("id") || "");
  const user = await requirePermission("UPDATE_REGISTRATIONS");
  const agreed = parseMoneyToCents(String(formData.get("agreedFee") || ""));
  const discount = parseMoneyToCents(String(formData.get("approvedDiscount") || "0"));
  const deposit = parseMoneyToCents(String(formData.get("requiredDeposit") || ""));
  if (agreed == null || agreed < 0 || discount == null || discount < 0 || (deposit != null && deposit < 0)) back(id, "Enter valid amounts.");
  if (discount > agreed) back(id, "The discount cannot be larger than the agreed fee.");
  await prisma.courseRegistration.update({
    where: { id },
    data: {
      agreedFee: centsToDecimalString(agreed),
      approvedDiscount: centsToDecimalString(discount),
      requiredDeposit: deposit == null ? null : centsToDecimalString(deposit),
      updatedById: user.id,
      events: { create: { action: "Fee updated", newValue: centsToDecimalString(agreed - discount), actorId: user.id } },
    },
  });
  await refreshStanding(id);
  revalidatePath(`/admin/registrations/${id}`);
  back(id);
}

export async function updateIntake(formData: FormData) {
  const id = String(formData.get("id") || "");
  const user = await requirePermission("ASSIGN_INTAKE");
  const intakeName = String(formData.get("intakeName") || "").trim();
  const registration = await prisma.courseRegistration.findUnique({ where: { id } });
  if (!registration) back(id, "Registration not found.");
  try {
    await prisma.courseRegistration.update({
      where: { id },
      data: { intakeName: intakeName || null, intakeKey: intakeKey(intakeName), updatedById: user.id, events: { create: { action: "Intake updated", previousValue: registration.intakeName, newValue: intakeName || "None", actorId: user.id } } },
    });
  } catch {
    back(id, "Another active registration already uses that course and intake.");
  }
  revalidatePath(`/admin/registrations/${id}`);
  back(id);
}

export async function updateStartDate(formData: FormData) {
  const id = String(formData.get("id") || "");
  const user = await requirePermission("CHANGE_START_DATE");
  const date = String(formData.get("expectedStartDate") || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back(id, "Enter a valid start date.");
  const registration = await prisma.courseRegistration.findUnique({ where: { id } });
  if (!registration) back(id, "Registration not found.");
  await prisma.courseRegistration.update({
    where: { id },
    data: {
      expectedStartDate: localDateTimeToUtc(date, "09:00"),
      classProgress: registration.classProgress === "NOT_SCHEDULED" ? "SCHEDULED" : undefined,
      updatedById: user.id,
      events: { create: { action: "Start date changed", previousValue: registration.expectedStartDate ? appDate(registration.expectedStartDate) : "None", newValue: date, actorId: user.id } },
    },
  });
  await refreshStanding(id);
  revalidatePath(`/admin/registrations/${id}`);
  back(id);
}

export async function markClass(formData: FormData) {
  const id = String(formData.get("id") || "");
  const next = String(formData.get("progress") || "");
  const date = String(formData.get("date") || "");
  const reason = String(formData.get("reason") || "").trim();
  const confirm = formData.get("confirm") === "yes";
  if (!confirm) back(id, "Confirm this update before saving it.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back(id, "Enter the actual date.");
  const user = await requirePermission(next === "FINISHED" ? "MARK_CLASS_FINISHED" : "MARK_CLASS_STARTED");
  const registration = await prisma.courseRegistration.findUnique({ where: { id } });
  if (!registration) back(id, "Registration not found.");
  if (["REJECTED", "CANCELLED", "WITHDRAWN"].includes(registration.registrationStatus)) back(id, "This registration is closed.");
  if (next === "STARTED" && registration.registrationStatus !== "CONFIRMED") back(id, "Confirm the registration before marking the class started.");
  try {
    assertClassTransition(registration.classProgress, next);
  } catch (error) {
    back(id, error instanceof WorkflowError ? error.message : "The class status could not be changed.");
  }
  const when = localDateTimeToUtc(date, "09:00");
  await prisma.courseRegistration.update({
    where: { id },
    data: {
      classProgress: next === "FINISHED" ? "FINISHED" : "STARTED",
      actualStartedAt: next === "STARTED" ? when : undefined,
      actualFinishedAt: next === "FINISHED" ? when : undefined,
      updatedById: user.id,
      events: { create: { action: next === "FINISHED" ? "Class finished" : "Class started", previousValue: registration.classProgress, newValue: next, reason: reason || null, actorId: user.id } },
    },
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: next === "FINISHED" ? "class.finished" : "class.started", entityType: "CourseRegistration", entityId: id, summary: `${registration.registrationNumber} marked ${next.toLowerCase()}` } });
  revalidatePath(`/admin/registrations/${id}`);
  back(id);
}

export async function recordCoursePayment(formData: FormData) {
  const id = String(formData.get("id") || "");
  const user = await requirePermission("RECORD_COURSE_PAYMENTS");
  const amount = parseMoneyToCents(String(formData.get("amount") || ""));
  const method = String(formData.get("method") || "");
  const date = String(formData.get("paidAt") || "");
  const reference = String(formData.get("transactionReference") || "").trim();
  const remarks = String(formData.get("remarks") || "").trim();
  const ledgerType = String(formData.get("ledgerType") || "PAYMENT");
  if (amount == null || amount <= 0) back(id, "Enter a positive amount.");
  if (method !== "CASH" && method !== "BANK_TRANSFER") back(id, "Choose cash or bank transfer.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back(id, "Enter the payment date.");
  if (ledgerType !== "PAYMENT" && ledgerType !== "REFUND" && ledgerType !== "REVERSAL") back(id, "Choose a payment type.");
  if (ledgerType !== "PAYMENT" && !hasPermission(user, "REFUND_COURSE_PAYMENTS")) back(id, "You cannot record a refund.");
  const registration = await prisma.courseRegistration.findUnique({ where: { id } });
  if (!registration) back(id, "Registration not found.");
  const proof = formData.get("proof");
  const proofPath = proof instanceof File ? await saveManagedUpload(proof, "course-payment", registration.registrationNumber) : null;
  const verifyNow = formData.get("verifyNow") === "yes" && hasPermission(user, "VERIFY_COURSE_PAYMENTS");
  try {
    await prisma.coursePayment.create({
      data: {
        registrationId: id,
        studentId: registration.studentId,
        amount: centsToDecimalString(amount),
        method,
        ledgerType,
        paidAt: localDateTimeToUtc(date, "09:00"),
        transactionReference: reference || null,
        referenceGuard: reference ? `${id}:${reference.toLowerCase()}` : null,
        proofPath,
        verificationStatus: verifyNow ? "VERIFIED" : "PENDING",
        verifiedById: verifyNow ? user.id : null,
        verifiedAt: verifyNow ? new Date() : null,
        recordedById: user.id,
        remarks: remarks || null,
      },
    });
  } catch {
    back(id, "That transaction reference is already recorded for this registration.");
  }
  await refreshStanding(id);
  await prisma.registrationEvent.create({ data: { registrationId: id, action: verifyNow ? "Payment verified" : "Payment recorded", newValue: centsToDecimalString(amount), actorId: user.id, reason: remarks || null } });
  revalidatePath(`/admin/registrations/${id}`);
  back(id);
}

export async function reviewCoursePayment(formData: FormData) {
  const id = String(formData.get("id") || "");
  const paymentId = String(formData.get("paymentId") || "");
  const decision = String(formData.get("decision") || "");
  const user = await requirePermission(decision === "VERIFIED" ? "VERIFY_COURSE_PAYMENTS" : "REJECT_COURSE_PAYMENTS");
  const payment = await prisma.coursePayment.findFirst({ where: { id: paymentId, registrationId: id } });
  if (!payment || payment.verificationStatus !== "PENDING") back(id, "Only a pending payment can be reviewed.");
  await prisma.coursePayment.update({
    where: { id: paymentId },
    data: { verificationStatus: decision === "VERIFIED" ? "VERIFIED" : "REJECTED", verifiedById: user.id, verifiedAt: new Date(), remarks: String(formData.get("remarks") || payment.remarks || "") },
  });
  await refreshStanding(id);
  await prisma.registrationEvent.create({ data: { registrationId: id, action: decision === "VERIFIED" ? "Payment verified" : "Payment rejected", previousValue: "PENDING", newValue: decision, actorId: user.id } });
  revalidatePath(`/admin/registrations/${id}`);
  back(id);
}

export async function bulkMarkStarted(formData: FormData) {
  const user = await requirePermission("BULK_UPDATE_REGISTRATIONS");
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const date = String(formData.get("date") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (formData.get("confirm") !== "yes") redirect("/admin/registrations?error=" + encodeURIComponent("Confirm the bulk update before it is saved."));
  if (ids.length === 0) redirect("/admin/registrations?error=" + encodeURIComponent("Select at least one registration."));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/admin/registrations?error=" + encodeURIComponent("Enter the actual start date."));
  const when = localDateTimeToUtc(date, "09:00");
  try {
    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        const registration = await tx.courseRegistration.findUnique({ where: { id } });
        if (!registration || !canBulkStart(registration)) {
          throw new WorkflowError(`${registration?.registrationNumber || "A selected row"} is not eligible. Confirm the registration first, and leave finished classes unchanged.`);
        }
        await tx.courseRegistration.update({ where: { id }, data: { classProgress: "STARTED", actualStartedAt: when, updatedById: user.id } });
        await tx.registrationEvent.create({ data: { registrationId: id, action: "Class started", previousValue: registration.classProgress, newValue: "STARTED", reason: reason || "Bulk update", actorId: user.id } });
        await tx.auditLog.create({ data: { actorId: user.id, action: "class.started", entityType: "CourseRegistration", entityId: id, summary: `${registration.registrationNumber} marked started for the selected students only` } });
      }
    });
  } catch (error) {
    const message = error instanceof WorkflowError ? error.message : "The selected registrations were left unchanged.";
    redirect(`/admin/registrations?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin/registrations");
  redirect("/admin/registrations");
}

export async function createStaffRegistration(formData: FormData) {
  const user = await requirePermission("CREATE_REGISTRATIONS");
  try {
    const result = await createCourseRegistration({
      slug: String(formData.get("slug") || ""),
      fullName: String(formData.get("fullName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      city: String(formData.get("city") || ""),
      experience: String(formData.get("experience") || ""),
      intakeName: String(formData.get("intakeName") || ""),
      expectedStartDate: String(formData.get("expectedStartDate") || ""),
      notes: String(formData.get("notes") || ""),
      consent: formData.get("consent") === "yes",
      idempotencyKey: String(formData.get("idempotencyKey") || ""),
      source: user.role === "ADMIN" ? "ADMIN" : "RECEPTION",
      actorId: user.id,
    });
    const row = await prisma.courseRegistration.findUnique({ where: { registrationNumber: result.registrationNumber }, select: { id: true } });
    redirect(row ? `/admin/registrations/${row.id}` : "/admin/registrations");
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    const message = error instanceof RegistrationError ? error.message : "The registration could not be saved.";
    redirect(`/admin/registrations/new?error=${encodeURIComponent(message)}`);
  }
}
