export const registrationTransitions = {
  PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["CANCELLED", "WITHDRAWN"],
  REJECTED: [],
  CANCELLED: [],
  WITHDRAWN: [],
} as const;

export type RegistrationState = keyof typeof registrationTransitions;

export const classTransitions = {
  NOT_SCHEDULED: ["SCHEDULED", "STARTED", "CANCELLED"],
  SCHEDULED: ["STARTED", "POSTPONED", "CANCELLED"],
  STARTED: ["FINISHED", "POSTPONED"],
  POSTPONED: ["SCHEDULED", "STARTED", "CANCELLED"],
  FINISHED: [],
  CANCELLED: [],
} as const;

export type ClassState = keyof typeof classTransitions;

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

export function assertRegistrationTransition(from: string, to: string) {
  const allowed = registrationTransitions[from as RegistrationState];
  if (!allowed || !(allowed as readonly string[]).includes(to)) {
    throw new WorkflowError(`A registration cannot move from ${label(from)} to ${label(to)}.`);
  }
}

export function assertClassTransition(from: string, to: string) {
  const allowed = classTransitions[from as ClassState];
  if (!allowed || !(allowed as readonly string[]).includes(to)) {
    throw new WorkflowError(`Class progress cannot move from ${label(from)} to ${label(to)}.`);
  }
}

export function canBulkStart(registration: { registrationStatus: string; classProgress: string }) {
  return registration.registrationStatus === "CONFIRMED" && ["NOT_SCHEDULED", "SCHEDULED", "POSTPONED"].includes(registration.classProgress);
}

export function closesRegistration(status: string) {
  return status === "REJECTED" || status === "CANCELLED" || status === "WITHDRAWN";
}

function label(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

export function intakeKey(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function cleanLine(value: string, max: number) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function cleanMultiline(value: string, max: number) {
  return value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim().slice(0, max);
}
